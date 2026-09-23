/**
 * Script de Apps Script ligado a la hoja maestra del café bar (Le Tiende).
 * T-0036, docs/tech-specs.md §4.6, docs/MEMORY.md ADR-023.
 *
 * Qué hace:
 *  - Agrega el menú "Le Tiende → Publicar carta" al abrir la hoja (onOpen).
 *  - `publicarCarta()` lee las pestañas `carta_secciones` y `carta_diccionario`,
 *    valida su contenido y, si todo está bien, guarda una copia fija en las
 *    propiedades del documento. Si algo falla, NO publica: muestra el error
 *    en un diálogo y la copia anterior se queda intacta.
 *  - `doGet()` expone esa copia fija como JSON, de solo lectura, sin
 *    autenticación — es la Web App que lee el SSR de letiende.co.
 *
 * Qué NO hace, a propósito (ADR-023): no escribe nada hacia Comandante ni
 * hacia AWS. Los precios siguen saliendo únicamente de
 * `https://comandante.letiende.co/menu.json`.
 *
 * Despliegue (manual, ver herramientas/apps-script/README.md):
 *  - Dueño del documento y de este proyecto de Apps Script: ocastelblanco@gmail.com.
 *  - Extensiones → Apps Script → pegar este archivo → Implementar → Nueva
 *    implementación → tipo "Aplicación web" → ejecutar como "Yo" → acceso
 *    "Cualquier usuario".
 *  - La URL `.../exec` resultante es la que va en `environments/` de
 *    letiende.co (T-0037) como constante — nunca cambia de implementación
 *    sin avisar, porque cambiar de implementación cambia la URL.
 */

var HOJA_SECCIONES = 'carta_secciones';
var HOJA_DICCIONARIO = 'carta_diccionario';
var PROP_CARTA = 'carta_publicada';
var URL_MENU_COMANDANTE = 'https://comandante.letiende.co/menu.json';

/** Agrega el menú personalizado al abrir la hoja. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Le Tiende')
    .addItem('Publicar carta', 'publicarCarta')
    .addToUi();
}

/**
 * Valida las dos pestañas y, si no hay errores, publica una copia fija.
 * Nunca escribe una publicación parcial: o todo pasa la validación, o nada
 * se guarda.
 */
function publicarCarta() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var resultadoSecciones = leerYValidarSecciones(ss);
  var resultadoDiccionario = leerYValidarDiccionario(ss);

  var errores = resultadoSecciones.errores.concat(resultadoDiccionario.errores);
  if (errores.length > 0) {
    ui.alert(
      'No se publicó la carta',
      'Se encontraron ' + errores.length + ' error(es). Corrígelos y vuelve a intentar:\n\n' +
        errores.join('\n'),
      ui.ButtonSet.OK,
    );
    return;
  }

  var avisos = compararConMenuReal(resultadoSecciones.secciones, resultadoDiccionario.diccionario);

  var carta = {
    publicadoEn: new Date().toISOString(),
    secciones: resultadoSecciones.secciones,
    diccionario: resultadoDiccionario.diccionario,
  };

  PropertiesService.getDocumentProperties().setProperty(PROP_CARTA, JSON.stringify(carta));

  var mensaje =
    'Publicado: ' +
    carta.secciones.length +
    ' secciones, ' +
    Object.keys(carta.diccionario.adiciones).length +
    ' adiciones, ' +
    Object.keys(carta.diccionario.variantes).length +
    ' variantes.';
  if (avisos.length > 0) {
    mensaje += '\n\nAvisos (no bloquean la publicación):\n' + avisos.join('\n');
  }
  ui.alert('Carta publicada', mensaje, ui.ButtonSet.OK);
}

/**
 * Lee `carta_secciones`, valida cada fila y devuelve `{ secciones, errores }`.
 * Columnas esperadas, en este orden (tech-specs.md §4.6):
 * categoria | subcategoria | etiqueta | descripcion | icono | orden | visible | destacada
 */
function leerYValidarSecciones(ss) {
  var hoja = ss.getSheetByName(HOJA_SECCIONES);
  if (!hoja) {
    return { secciones: [], errores: ['No existe la pestaña "' + HOJA_SECCIONES + '".'] };
  }

  var filas = hoja.getDataRange().getValues();
  var encabezado = filas.shift();
  var col = indiceColumnas(encabezado, [
    'categoria',
    'subcategoria',
    'etiqueta',
    'descripcion',
    'icono',
    'orden',
    'visible',
    'destacada',
  ]);

  var errores = [];
  var secciones = [];
  var clavesVistas = {};
  var patronIcono = /^[a-z0-9_]+$/;

  filas.forEach(function (fila, i) {
    var numeroFila = i + 2; // +1 por el encabezado, +1 porque las hojas son 1-indexadas
    var categoria = String(fila[col.categoria] || '').trim();
    if (!categoria) return; // fila vacía, se omite en silencio

    var subcategoria = String(fila[col.subcategoria] || '').trim();
    var etiqueta = String(fila[col.etiqueta] || '').trim();
    var descripcion = String(fila[col.descripcion] || '').trim();
    var icono = String(fila[col.icono] || '').trim();
    var ordenCrudo = fila[col.orden];
    var visibleCrudo = fila[col.visible];
    var destacadaCrudo = fila[col.destacada];

    var clave = categoria + '/' + subcategoria;
    if (clavesVistas[clave]) {
      errores.push('Fila ' + numeroFila + ': "' + clave + '" está duplicada.');
      return;
    }
    clavesVistas[clave] = true;

    if (!etiqueta) {
      errores.push('Fila ' + numeroFila + ' (' + clave + '): falta la etiqueta.');
    }
    if (icono && !patronIcono.test(icono)) {
      errores.push(
        'Fila ' + numeroFila + ' (' + clave + '): el ícono "' + icono + '" no tiene un formato válido.',
      );
    }
    var orden = Number(ordenCrudo);
    if (ordenCrudo === '' || isNaN(orden)) {
      errores.push('Fila ' + numeroFila + ' (' + clave + '): "orden" no es un número.');
    }

    var visible = interpretarBooleano(visibleCrudo);
    if (visible === null) {
      errores.push('Fila ' + numeroFila + ' (' + clave + '): "visible" no se puede interpretar como sí/no.');
    }
    var destacada = interpretarBooleano(destacadaCrudo);
    if (destacada === null) {
      errores.push('Fila ' + numeroFila + ' (' + clave + '): "destacada" no se puede interpretar como sí/no.');
    }

    secciones.push({
      categoria: categoria,
      subcategoria: subcategoria || null,
      etiqueta: etiqueta,
      descripcion: descripcion || null,
      icono: icono || null,
      orden: orden,
      visible: visible === null ? true : visible,
      destacada: destacada === null ? false : destacada,
    });
  });

  return { secciones: secciones, errores: errores };
}

/**
 * Lee `carta_diccionario`, valida cada fila y devuelve
 * `{ diccionario: { adiciones, variantes }, errores }`.
 * Columnas esperadas: tipo | clave | texto.
 */
function leerYValidarDiccionario(ss) {
  var hoja = ss.getSheetByName(HOJA_DICCIONARIO);
  if (!hoja) {
    return {
      diccionario: { adiciones: {}, variantes: {} },
      errores: ['No existe la pestaña "' + HOJA_DICCIONARIO + '".'],
    };
  }

  var filas = hoja.getDataRange().getValues();
  var encabezado = filas.shift();
  var col = indiceColumnas(encabezado, ['tipo', 'clave', 'texto']);

  var errores = [];
  var adiciones = {};
  var variantes = {};
  var clavesVistas = {};

  filas.forEach(function (fila, i) {
    var numeroFila = i + 2;
    var tipo = String(fila[col.tipo] || '').trim().toLowerCase();
    var clave = String(fila[col.clave] || '').trim();
    var texto = String(fila[col.texto] || '').trim();

    if (!tipo && !clave && !texto) return; // fila vacía

    if (tipo !== 'adicion' && tipo !== 'variante') {
      errores.push(
        'Fila ' + numeroFila + ': "tipo" debe ser "adicion" o "variante", no "' + tipo + '".',
      );
      return;
    }
    if (!clave) {
      errores.push('Fila ' + numeroFila + ': falta la clave.');
      return;
    }
    var claveCompuesta = tipo + '/' + clave;
    if (clavesVistas[claveCompuesta]) {
      errores.push('Fila ' + numeroFila + ': "' + claveCompuesta + '" está duplicada.');
      return;
    }
    clavesVistas[claveCompuesta] = true;

    if (!texto) {
      errores.push('Fila ' + numeroFila + ' (' + claveCompuesta + '): falta el texto.');
      return;
    }

    if (tipo === 'adicion') {
      adiciones[clave] = texto;
    } else {
      variantes[clave] = texto;
    }
  });

  return { diccionario: { adiciones: adiciones, variantes: variantes }, errores: errores };
}

/**
 * Compara las claves reales de `menu.json` contra el diccionario y las
 * secciones de la hoja. Nunca bloquea la publicación (ADR-023, tech-specs.md
 * §4.6): si Comandante no responde, se avisa y se continúa igual.
 */
function compararConMenuReal(secciones, diccionario) {
  var avisos = [];
  var menu;
  try {
    var respuesta = UrlFetchApp.fetch(URL_MENU_COMANDANTE, { muteHttpExceptions: true });
    if (respuesta.getResponseCode() !== 200) {
      return ['No se pudo leer menu.json de Comandante (código ' + respuesta.getResponseCode() + ') — se publicó sin cruzar claves.'];
    }
    menu = JSON.parse(respuesta.getContentText());
  } catch (e) {
    return ['No se pudo leer menu.json de Comandante (' + e.message + ') — se publicó sin cruzar claves.'];
  }

  var seccionesVistas = {};
  secciones.forEach(function (s) {
    seccionesVistas[s.categoria + '/' + (s.subcategoria || '')] = true;
  });
  var adicionesVistas = Object.keys(diccionario.adiciones);
  var variantesVistas = Object.keys(diccionario.variantes);

  var seccionesFaltantes = {};
  var adicionesFaltantes = {};
  var variantesFaltantes = {};

  (menu.items || []).forEach(function (item) {
    var clave = item.category + '/' + (item.subcategory || '');
    if (!seccionesVistas[clave]) seccionesFaltantes[clave] = true;
    (item.additions || []).forEach(function (a) {
      if (adicionesVistas.indexOf(a.addition) === -1) adicionesFaltantes[a.addition] = true;
    });
    (item.variants || []).forEach(function (v) {
      if (variantesVistas.indexOf(v) === -1) variantesFaltantes[v] = true;
    });
  });

  if (Object.keys(seccionesFaltantes).length > 0) {
    avisos.push('Secciones en Comandante sin fila en la hoja: ' + Object.keys(seccionesFaltantes).join(', '));
  }
  if (Object.keys(adicionesFaltantes).length > 0) {
    avisos.push('Adiciones en Comandante sin traducción: ' + Object.keys(adicionesFaltantes).join(', '));
  }
  if (Object.keys(variantesFaltantes).length > 0) {
    avisos.push('Variantes en Comandante sin traducción: ' + Object.keys(variantesFaltantes).join(', '));
  }
  return avisos;
}

/** Sirve la última copia publicada. Sin publicación previa, responde una carta vacía. */
function doGet(e) {
  var guardado = PropertiesService.getDocumentProperties().getProperty(PROP_CARTA);
  var carta = guardado
    ? JSON.parse(guardado)
    : { publicadoEn: null, secciones: [], diccionario: { adiciones: {}, variantes: {} } };
  return ContentService.createTextOutput(JSON.stringify(carta)).setMimeType(ContentService.MimeType.JSON);
}

/** Mapa nombre de columna → índice, a partir de la fila de encabezado real. */
function indiceColumnas(encabezado, esperadas) {
  var col = {};
  esperadas.forEach(function (nombre) {
    var i = encabezado.indexOf(nombre);
    col[nombre] = i === -1 ? esperadas.indexOf(nombre) : i;
  });
  return col;
}

/** TRUE/FALSE, true/false, 1/0, sí/no → booleano. Cualquier otra cosa: null (no interpretable). */
function interpretarBooleano(valor) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') {
    if (valor === 1) return true;
    if (valor === 0) return false;
    return null;
  }
  var texto = String(valor || '').trim().toLowerCase();
  if (texto === 'true' || texto === 'si' || texto === 'sí' || texto === '1') return true;
  if (texto === 'false' || texto === 'no' || texto === '0') return false;
  return null;
}
