/**
 * Google Apps Script para enviar contenido desde Google Sheets a la API de Le Tiende
 * Este script se ejecuta cuando se edita alguna celda en la hoja de cálculo
 * y envía el contenido actualizado a AWS Lambda para almacenarlo en S3
 *
 * @see docs/esquema-contenido.json para la estructura del JSON
 */

/**
 * Función principal que se ejecuta al editar la hoja
 * @param {Object} e - Evento de edición de Google Sheets
 */
function onEdit(e) {
  // Obtener la hoja activa
  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();

  // Mapeo de nombres de hojas a secciones
  const seccionesMap = {
    'Inicio': 'inicio',
    'Menu': 'menu',
    'Eventos': 'eventos',
    'Auditorio': 'auditorio',
    'Libreria': 'libreria',
    'Contacto': 'contacto',
    'Nosotros': 'nosotros'
  };

  // Validar que la hoja editada corresponde a una sección válida
  if (!seccionesMap[sheetName]) {
    Logger.log(`Hoja "${sheetName}" no requiere sincronización`);
    return;
  }

  const seccion = seccionesMap[sheetName];

  // Construir el contenido según la hoja editada
  let contenido;
  try {
    switch (seccion) {
      case 'inicio':
        contenido = construirContenidoInicio(sheet);
        break;
      case 'menu':
        contenido = construirContenidoMenu(sheet);
        break;
      case 'eventos':
        contenido = construirContenidoEventos(sheet);
        break;
      default:
        Logger.log(`No hay constructor definido para la sección "${seccion}"`);
        return;
    }

    // Enviar a la API
    enviarContenidoAPI(contenido);

  } catch (error) {
    Logger.log(`Error procesando contenido de ${sheetName}: ${error.message}`);
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
  }
}

/**
 * Construye el JSON de la sección Inicio
 * @param {Sheet} sheet - Hoja de Google Sheets
 * @returns {Object} - Contenido estructurado
 */
function construirContenidoInicio(sheet) {
  // Ejemplo de estructura de la hoja:
  // A: Campo | B: ES | C: EN
  // 1: titulo | Le Tiende - Centro Cultural | Le Tiende - Cultural Center
  // 2: subtitulo | Café en taza... | Coffee in a cup...

  const data = sheet.getDataRange().getValues();
  const estructura = {};

  // Procesar filas (saltando cabecera)
  for (let i = 1; i < data.length; i++) {
    const campo = data[i][0];
    const valorES = data[i][1];
    const valorEN = data[i][2];

    if (campo && valorES) {
      if (!estructura.es) estructura.es = {};
      if (!estructura.en) estructura.en = {};

      estructura.es[campo] = valorES;
      if (valorEN) estructura.en[campo] = valorEN;
    }
  }

  return {
    seccion: 'inicio',
    idiomas: estructura,
    metadata: {
      autor: Session.getActiveUser().getEmail(),
      ultima_revision: new Date().toISOString().split('T')[0],
      version: '1.0',
      publicado: true
    }
  };
}

/**
 * Construye el JSON de la sección Menú
 * @param {Sheet} sheet - Hoja de Google Sheets
 * @returns {Object} - Contenido estructurado
 */
function construirContenidoMenu(sheet) {
  // Estructura de ejemplo:
  // A: Categoría | B: ID Item | C: Nombre ES | D: Desc ES | E: Precio | F: Nombre EN | G: Desc EN

  const data = sheet.getDataRange().getValues();
  const categoriasES = {};
  const categoriasEN = {};

  for (let i = 1; i < data.length; i++) {
    const [categoria, id, nombreES, descES, precio, nombreEN, descEN] = data[i];

    if (!categoria || !id) continue;

    // Inicializar categoría si no existe
    if (!categoriasES[categoria]) {
      categoriasES[categoria] = {
        id: categoria.toLowerCase().replace(/\s/g, '_'),
        nombre: categoria,
        items: []
      };
      categoriasEN[categoria] = {
        id: categoria.toLowerCase().replace(/\s/g, '_'),
        nombre: categoria,
        items: []
      };
    }

    // Agregar item en español
    categoriasES[categoria].items.push({
      id: id,
      nombre: nombreES,
      descripcion: descES,
      precio: precio,
      moneda: 'COP',
      disponible: true
    });

    // Agregar item en inglés
    if (nombreEN) {
      categoriasEN[categoria].items.push({
        id: id,
        nombre: nombreEN,
        descripcion: descEN,
        precio: precio,
        moneda: 'COP',
        disponible: true
      });
    }
  }

  return {
    seccion: 'menu',
    idiomas: {
      es: {
        titulo: 'Nuestro Menú',
        categorias: Object.values(categoriasES)
      },
      en: {
        titulo: 'Our Menu',
        categorias: Object.values(categoriasEN)
      }
    },
    metadata: {
      autor: Session.getActiveUser().getEmail(),
      ultima_revision: new Date().toISOString().split('T')[0],
      version: '2.3',
      publicado: true
    }
  };
}

/**
 * Construye el JSON de la sección Eventos
 * @param {Sheet} sheet - Hoja de Google Sheets
 * @returns {Object} - Contenido estructurado
 */
function construirContenidoEventos(sheet) {
  // Estructura de ejemplo:
  // A: ID | B: Título ES | C: Desc ES | D: Fecha Inicio | E: Precio | F: Título EN | G: Desc EN

  const data = sheet.getDataRange().getValues();
  const eventosES = [];
  const eventosEN = [];

  for (let i = 1; i < data.length; i++) {
    const [id, tituloES, descES, fechaInicio, precio, tituloEN, descEN] = data[i];

    if (!id || !tituloES) continue;

    // Evento en español
    eventosES.push({
      id: id,
      titulo: tituloES,
      descripcion: descES,
      fecha_inicio: new Date(fechaInicio).toISOString(),
      precios: [{
        categoria: 'General',
        valor: precio,
        moneda: 'COP'
      }],
      destacado: i === 1 // Primer evento destacado
    });

    // Evento en inglés
    if (tituloEN) {
      eventosEN.push({
        id: id,
        titulo: tituloEN,
        descripcion: descEN,
        fecha_inicio: new Date(fechaInicio).toISOString(),
        precios: [{
          categoria: 'General',
          valor: precio,
          moneda: 'COP'
        }],
        destacado: i === 1
      });
    }
  }

  return {
    seccion: 'eventos',
    idiomas: {
      es: {
        titulo: 'Eventos en Le Teatre',
        eventos: eventosES
      },
      en: {
        titulo: 'Events at Le Teatre',
        eventos: eventosEN
      }
    },
    metadata: {
      autor: Session.getActiveUser().getEmail(),
      ultima_revision: new Date().toISOString().split('T')[0],
      version: '1.5',
      publicado: true
    }
  };
}

/**
 * Envía el contenido a la API de Lambda
 * @param {Object} contenido - JSON estructurado según esquema
 */
function enviarContenidoAPI(contenido) {
  const API_URL = 'https://api.letiende.co/actualizarContenido';

  // Agregar timestamp
  contenido.timestamp = new Date().toISOString();

  const opciones = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(contenido),
    muteHttpExceptions: true
  };

  try {
    const respuesta = UrlFetchApp.fetch(API_URL, opciones);
    const codigo = respuesta.getResponseCode();
    const cuerpo = JSON.parse(respuesta.getContentText());

    if (codigo === 200 && cuerpo.success) {
      Logger.log(`✅ Contenido de "${contenido.seccion}" actualizado exitosamente`);
      Logger.log(`URL: ${cuerpo.url}`);
      Logger.log(`Timestamp: ${cuerpo.timestamp}`);

      // Opcional: Mostrar notificación en la UI
      SpreadsheetApp.getUi().alert(
        'Contenido Sincronizado',
        `La sección "${contenido.seccion}" se actualizó exitosamente en S3.`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else {
      throw new Error(cuerpo.message || 'Error desconocido en la API');
    }

  } catch (error) {
    Logger.log(`❌ Error enviando a API: ${error.message}`);
    SpreadsheetApp.getUi().alert(
      'Error de Sincronización',
      `No se pudo actualizar el contenido: ${error.message}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Función de prueba manual (ejecutar desde el editor de Apps Script)
 */
function testEnviarContenido() {
  const contenidoPrueba = {
    seccion: 'inicio',
    idiomas: {
      es: {
        titulo: 'Prueba desde Apps Script',
        subtitulo: 'Este es un test'
      },
      en: {
        titulo: 'Test from Apps Script',
        subtitulo: 'This is a test'
      }
    },
    metadata: {
      autor: 'Test',
      version: '0.1',
      publicado: false
    }
  };

  enviarContenidoAPI(contenidoPrueba);
}
