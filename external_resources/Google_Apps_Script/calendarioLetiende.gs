/**
 * Script de Sincronización Bidireccional: Google Calendar <-> eventos.json (S3)
 *
 * Este script gestiona la sincronización automática entre el calendario dedicado
 * de Le Tiende y el archivo eventos.json almacenado en S3 mediante la API Lambda.
 *
 * REQUISITOS:
 * 1. Habilitar "Google Calendar API" (v3) en Servicios Avanzados del proyecto GAS:
 *    - Ir a: Editor > Servicios > + Agregar un servicio
 *    - Buscar "Google Calendar API" y agregarla
 *
 * 2. Configurar trigger instalable:
 *    - Ir a: Editor > Activadores > + Agregar activador
 *    - Función: sincronizarCalendario
 *    - Origen del evento: Desde el calendario
 *    - Calendario: (usar el CALENDAR_ID indicado abajo)
 *    - Eventos que activan: Al actualizar un evento
 *
 * 3. Desplegar como Web App (para recibir POST desde admin console):
 *    - Ir a: Implementar > Nueva implementación
 *    - Tipo: Aplicación web
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier usuario
 *
 * FLUJOS:
 * - Admin console → doPost() → Google Calendar (crear/editar/eliminar)
 * - Google Calendar → sincronizarCalendario() → Lambda → eventos.json (actualizar S3)
 *
 * @author Le Tiende
 * @version 2.0.0
 */

// ============================================================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================================================

/** ID del calendario dedicado de Le Tiende (calendario secundario) */
const CALENDAR_ID = '950c34aa231fea3be8dd2d963298245d50622a9fada6236777d2abba8930c846@group.calendar.google.com';

/** URL de la API Lambda para gestionar eventos */
const API_URL = 'https://api.letiende.co/gestionarEvento';

/** Clave para almacenar el ID de evento de Le Tiende en extendedProperties */
const PROP_KEY = 'letiende_evento_id';

/** Clave para almacenar el token de sincronización incremental */
const SYNC_TOKEN_KEY = 'calendar_sync_token';

/** Pausa en milisegundos entre llamadas a la API de Calendar (evita quota exceeded) */
const PAUSA_ENTRE_LLAMADAS_MS = 500;

// ============================================================================
// ENDPOINTS WEB APP
// ============================================================================

/**
 * Endpoint GET de la Web App.
 * Retorna un mensaje informativo indicando que la API está activa.
 *
 * @returns {TextOutput} Respuesta JSON con estado de la API
 */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      mensaje: 'API de sincronización Calendar <-> Le Tiende activa',
      version: '2.0.0'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Endpoint POST que recibe operaciones desde el admin console de Le Tiende.
 *
 * Procesa solicitudes de crear, editar o eliminar eventos en Google Calendar,
 * manteniendo la relación bidireccional con eventos.json mediante extendedProperties.
 *
 * @param {Object} e - Objeto de evento con postData.contents (JSON string)
 * @returns {TextOutput} Respuesta JSON con { success, calendarEventId } o { success, error }
 */
function doPost(e) {
  try {
    const datos = JSON.parse(e.postData.contents);
    const { accion, evento } = datos;

    console.log(`[doPost] Acción recibida: ${accion} para evento ${evento.id}`);

    let calendarEventId = null;

    switch (accion) {
      case 'crear': {
        const calendarEventNuevo = eventoToCalendarEvent(evento);
        const eventoCreado = Calendar.Events.insert(calendarEventNuevo, CALENDAR_ID);
        calendarEventId = eventoCreado.id;

        // Guardar mapping en PropertiesService como backup
        PropertiesService.getScriptProperties().setProperty(`cal_${calendarEventId}`, evento.id);

        console.log(`[doPost] Evento creado en Calendar: ${calendarEventId}`);
        break;
      }

      case 'editar': {
        const eventoExistente = buscarEventoPorLetiendeId(evento.id);

        if (!eventoExistente) {
          throw new Error(`No se encontró el evento con ID ${evento.id} en Google Calendar`);
        }

        const calendarEventEditado = eventoToCalendarEvent(evento);
        const eventoActualizado = Calendar.Events.update(
          calendarEventEditado,
          CALENDAR_ID,
          eventoExistente.id
        );
        calendarEventId = eventoActualizado.id;

        console.log(`[doPost] Evento editado en Calendar: ${calendarEventId}`);
        break;
      }

      case 'eliminar': {
        const eventoAEliminar = buscarEventoPorLetiendeId(evento.id);

        if (!eventoAEliminar) {
          console.log(`[doPost] Evento ${evento.id} no encontrado en Calendar (ya eliminado)`);
          return ContentService
            .createTextOutput(JSON.stringify({ success: true, mensaje: 'Evento ya no existe en Calendar' }))
            .setMimeType(ContentService.MimeType.JSON);
        }

        Calendar.Events.remove(CALENDAR_ID, eventoAEliminar.id);
        calendarEventId = eventoAEliminar.id;

        // Limpiar mapping de PropertiesService
        PropertiesService.getScriptProperties().deleteProperty(`cal_${calendarEventId}`);

        console.log(`[doPost] Evento eliminado de Calendar: ${calendarEventId}`);
        break;
      }

      default:
        throw new Error(`Acción no válida: ${accion}`);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, calendarEventId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error(`[doPost] Error: ${error.message}`);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// SINCRONIZACIÓN INCREMENTAL (TRIGGER DE CALENDAR)
// ============================================================================

/**
 * Función principal de sincronización desde Google Calendar hacia Lambda/S3.
 *
 * Usa LockService para evitar ejecuciones simultáneas (el trigger puede dispararse
 * múltiples veces seguidas). Usa sync tokens para obtener solo los cambios
 * desde la última ejecución.
 *
 * En el sync completo inicial (sin syncToken), solo se obtiene y guarda el token
 * sin procesar eventos existentes, ya que el calendario nuevo empieza vacío o
 * los eventos existentes no tienen formato Le Tiende.
 *
 * @throws {Error} Si falla la comunicación con Calendar API o Lambda
 */
function sincronizarCalendario() {
  // Obtener lock para evitar ejecuciones simultáneas (esperar hasta 10 segundos)
  const lock = LockService.getScriptLock();
  const lockObtenido = lock.tryLock(10000);

  if (!lockObtenido) {
    console.log('[sincronizarCalendario] Otra ejecución en curso, saliendo');
    return;
  }

  try {
    console.log('[sincronizarCalendario] Iniciando sincronización...');

    const props = PropertiesService.getScriptProperties();
    let syncToken = props.getProperty(SYNC_TOKEN_KEY);

    let listaEventos;

    if (!syncToken) {
      // Primera ejecución: obtener syncToken sin procesar eventos
      console.log('[sincronizarCalendario] No hay syncToken, obteniendo token inicial');
      listaEventos = Calendar.Events.list(CALENDAR_ID, {
        timeMin: new Date().toISOString(),
        showDeleted: false,
        maxResults: 1
      });

      // Solo guardar el token y salir
      if (listaEventos.nextSyncToken) {
        props.setProperty(SYNC_TOKEN_KEY, listaEventos.nextSyncToken);
        console.log('[sincronizarCalendario] SyncToken inicial guardado');
      }

      lock.releaseLock();
      return;
    }

    // Sync incremental: solo cambios desde el último token
    try {
      console.log('[sincronizarCalendario] Ejecutando sync incremental');
      listaEventos = Calendar.Events.list(CALENDAR_ID, {
        syncToken: syncToken,
        showDeleted: true
      });
    } catch (error) {
      // Error 410: syncToken expirado, obtener nuevo token sin procesar
      if (error.message.includes('410') || error.message.includes('Sync token')) {
        console.log('[sincronizarCalendario] SyncToken expirado, obteniendo nuevo token');
        props.deleteProperty(SYNC_TOKEN_KEY);

        listaEventos = Calendar.Events.list(CALENDAR_ID, {
          timeMin: new Date().toISOString(),
          showDeleted: false,
          maxResults: 1
        });

        if (listaEventos.nextSyncToken) {
          props.setProperty(SYNC_TOKEN_KEY, listaEventos.nextSyncToken);
          console.log('[sincronizarCalendario] Nuevo syncToken guardado tras expiración');
        }

        lock.releaseLock();
        return;
      }

      throw error;
    }

    const eventos = listaEventos.items || [];
    console.log(`[sincronizarCalendario] Procesando ${eventos.length} evento(s) modificado(s)`);

    // Procesar cada evento con pausa entre llamadas para no exceder cuota
    for (let i = 0; i < eventos.length; i++) {
      procesarEventoCalendar(eventos[i]);

      // Pausa entre eventos para respetar cuotas de Calendar API
      if (i < eventos.length - 1) {
        Utilities.sleep(PAUSA_ENTRE_LLAMADAS_MS);
      }
    }

    // Guardar nuevo syncToken
    if (listaEventos.nextSyncToken) {
      props.setProperty(SYNC_TOKEN_KEY, listaEventos.nextSyncToken);
      console.log('[sincronizarCalendario] SyncToken actualizado');
    }

    console.log('[sincronizarCalendario] Sincronización completada');

  } catch (error) {
    console.error(`[sincronizarCalendario] Error: ${error.message}`);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Procesa un evento individual de Google Calendar y lo sincroniza con Lambda.
 *
 * Determina la acción apropiada (crear/editar/eliminar) según el estado del evento
 * y la presencia de extendedProperties con letiende_evento_id.
 *
 * @param {Object} calEvent - Evento de Google Calendar (resource de Calendar API v3)
 */
function procesarEventoCalendar(calEvent) {
  try {
    // CASO 1: Evento cancelado/eliminado
    if (calEvent.status === 'cancelled') {
      console.log(`[procesarEventoCalendar] Evento cancelado: ${calEvent.id}`);

      // Intentar obtener letiende_evento_id de extendedProperties
      let letiendeEventoId = null;
      if (calEvent.extendedProperties && calEvent.extendedProperties.private) {
        letiendeEventoId = calEvent.extendedProperties.private[PROP_KEY];
      }

      // Si no está en extendedProperties, buscar en PropertiesService (backup)
      if (!letiendeEventoId) {
        letiendeEventoId = PropertiesService.getScriptProperties().getProperty(`cal_${calEvent.id}`);
      }

      if (letiendeEventoId) {
        enviarALambda('eliminar', null, letiendeEventoId);
        PropertiesService.getScriptProperties().deleteProperty(`cal_${calEvent.id}`);
        console.log(`[procesarEventoCalendar] Evento ${letiendeEventoId} eliminado de S3`);
      } else {
        console.log('[procesarEventoCalendar] Evento cancelado sin letiende_evento_id, ignorando');
      }
      return;
    }

    // Ignorar eventos de día completo (sin dateTime)
    if (!calEvent.start || !calEvent.start.dateTime) {
      console.log(`[procesarEventoCalendar] Evento sin dateTime (día completo), ignorando: ${calEvent.id}`);
      return;
    }

    // CASO 2: Evento con letiende_evento_id (editado desde admin o Calendar)
    if (calEvent.extendedProperties && calEvent.extendedProperties.private && calEvent.extendedProperties.private[PROP_KEY]) {
      const letiendeEventoId = calEvent.extendedProperties.private[PROP_KEY];
      console.log(`[procesarEventoCalendar] Evento con ID Le Tiende: ${letiendeEventoId}, actualizando`);

      // Actualizar mapping en PropertiesService
      PropertiesService.getScriptProperties().setProperty(`cal_${calEvent.id}`, letiendeEventoId);

      const eventoConvertido = calendarEventToEvento(calEvent);
      enviarALambda('editar', eventoConvertido, null);
      return;
    }

    // CASO 3: Evento nuevo creado directamente en Calendar
    console.log(`[procesarEventoCalendar] Evento nuevo sin ID Le Tiende: ${calEvent.id}`);

    const nuevoEventoId = 'evento-' + Utilities.getUuid();

    // Actualizar evento en Calendar con extendedProperties
    Utilities.sleep(PAUSA_ENTRE_LLAMADAS_MS);
    Calendar.Events.patch(
      {
        extendedProperties: {
          private: {
            [PROP_KEY]: nuevoEventoId
          }
        }
      },
      CALENDAR_ID,
      calEvent.id
    );

    // Guardar mapping en PropertiesService
    PropertiesService.getScriptProperties().setProperty(`cal_${calEvent.id}`, nuevoEventoId);

    // Convertir y enviar a Lambda
    const eventoConvertido = calendarEventToEvento(calEvent);
    eventoConvertido.id = nuevoEventoId;
    enviarALambda('crear', eventoConvertido, null);

    console.log(`[procesarEventoCalendar] Evento creado en S3 con ID: ${nuevoEventoId}`);

  } catch (error) {
    console.error(`[procesarEventoCalendar] Error procesando evento ${calEvent.id}: ${error.message}`);
  }
}

// ============================================================================
// UTILIDAD: RESETEAR SYNC TOKEN
// ============================================================================

/**
 * Elimina el syncToken almacenado. Útil para forzar una re-sincronización limpia.
 * Ejecutar manualmente desde el editor de GAS cuando sea necesario.
 */
function resetearSyncToken() {
  PropertiesService.getScriptProperties().deleteProperty(SYNC_TOKEN_KEY);
  console.log('[resetearSyncToken] SyncToken eliminado. La próxima sincronización obtendrá un token nuevo.');
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Busca un evento en Google Calendar usando el ID de evento de Le Tiende.
 *
 * @param {string} eventoId - ID del evento en Le Tiende (ej: "evento-123")
 * @returns {Object|null} Evento de Calendar API v3 o null si no se encuentra
 */
function buscarEventoPorLetiendeId(eventoId) {
  try {
    const query = `${PROP_KEY}=${eventoId}`;
    const listaEventos = Calendar.Events.list(CALENDAR_ID, {
      privateExtendedProperty: query,
      showDeleted: false,
      maxResults: 1
    });

    if (listaEventos.items && listaEventos.items.length > 0) {
      return listaEventos.items[0];
    }

    return null;
  } catch (error) {
    console.error(`[buscarEventoPorLetiendeId] Error: ${error.message}`);
    return null;
  }
}

/**
 * Convierte un evento de Google Calendar al formato de Le Tiende (solo ES).
 *
 * @param {Object} calEvent - Evento de Calendar API v3
 * @returns {Object} Evento en formato Le Tiende
 */
function calendarEventToEvento(calEvent) {
  let eventoId = null;
  if (calEvent.extendedProperties && calEvent.extendedProperties.private) {
    eventoId = calEvent.extendedProperties.private[PROP_KEY];
  }

  return {
    id: eventoId || 'evento-' + Utilities.getUuid(),
    titulo: calEvent.summary || 'Sin título',
    descripcion: calEvent.description || '',
    fecha_inicio: calEvent.start.dateTime,
    fecha_fin: calEvent.end.dateTime,
    ubicacion: calEvent.location || 'Le Teatre - Parkway, Bogotá',
    media_id: '',
    media_tipo: 'image',
    artistas: [],
    precios: [],
    forma_pago: ['taquilla_fisica'],
    capacidad: 0,
    entradas_disponibles: 0,
    categorias: [],
    destacado: false
  };
}

/**
 * Convierte un evento de Le Tiende al formato de Google Calendar.
 *
 * @param {Object} evento - Evento en formato Le Tiende
 * @returns {Object} Evento en formato Calendar API v3
 */
function eventoToCalendarEvent(evento) {
  return {
    summary: evento.titulo,
    description: evento.descripcion || '',
    start: {
      dateTime: evento.fecha_inicio,
      timeZone: 'America/Bogota'
    },
    end: {
      dateTime: evento.fecha_fin,
      timeZone: 'America/Bogota'
    },
    location: evento.ubicacion || 'Le Teatre - Parkway, Bogotá',
    extendedProperties: {
      private: {
        [PROP_KEY]: evento.id
      }
    }
  };
}

/**
 * Envía una operación a la API Lambda para actualizar eventos.json en S3.
 *
 * @param {string} accion - Tipo de operación: "crear", "editar" o "eliminar"
 * @param {Object|null} evento - Objeto evento (null si accion es "eliminar")
 * @param {string|null} eventoId - ID del evento (solo para "eliminar")
 * @returns {Object} Respuesta parseada de Lambda
 */
function enviarALambda(accion, evento, eventoId) {
  try {
    const payload = {
      accion: accion,
      evento: evento,
      eventoId: eventoId
    };

    const opciones = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    console.log(`[enviarALambda] Enviando ${accion} a Lambda`);
    const respuesta = UrlFetchApp.fetch(API_URL, opciones);
    const resultado = JSON.parse(respuesta.getContentText());

    if (!resultado.success) {
      console.error(`[enviarALambda] Lambda retornó error: ${resultado.message || 'Error desconocido'}`);
      return resultado;
    }

    console.log(`[enviarALambda] ${accion} exitoso`);
    return resultado;

  } catch (error) {
    console.error(`[enviarALambda] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}
