/**
 * Script de Apps Script ligado a la hoja de enlaces de Le Tiende (`/enlaces`).
 * T-0041, docs/tech-specs.md §4.7, docs/MEMORY.md ADR-026.
 *
 * Qué hace:
 *  - Agrega el menú "Le Tiende → Publicar enlaces" al abrir la hoja (onOpen).
 *  - `publicarEnlaces()` lee la pestaña `enlaces`, valida su contenido y, si
 *    todo está bien, guarda una copia fija en las propiedades del documento.
 *    Si algo falla, NO publica: muestra los errores en un diálogo y la copia
 *    anterior se queda intacta.
 *  - `doGet()` expone esa copia fija como JSON, de solo lectura, sin
 *    autenticación — es la Web App que lee el SSR de letiende.co.
 *
 * Qué NO hace, a propósito (ADR-026): no escribe nada hacia AWS ni guarda
 * ninguna credencial. No usa parámetros de la petición: `doGet` ignora `e`.
 *
 * IMPORTANTE: este script va en el proyecto de Apps Script de la hoja de
 * ENLACES, no en el de la carta. Los dos definen `onOpen` y `doGet`, y en un
 * mismo proyecto uno pisaría al otro.
 *
 * Despliegue (manual, ver herramientas/apps-script/README.md):
 *  - Dueño del documento y de este proyecto: ocastelblanco@gmail.com.
 *  - Extensiones → Apps Script → pegar este archivo → Implementar → Nueva
 *    implementación → "Aplicación web" → ejecutar como "Yo" → acceso
 *    "Cualquier usuario".
 *  - La URL `.../exec` resultante va como constante en `environments/` de
 *    letiende.co. Cambiar de implementación cambia la URL: para cambiar el
 *    código, siempre "Gestionar implementaciones → Nueva versión".
 */

var HOJA_ENLACES = 'enlaces';
var PROP_ENLACES = 'enlaces_publicados';

/** Claves que el código de letiende.co ya sabe dibujar. Solo sirve para avisar. */
var ICONOS_CONOCIDOS = ['youtube', 'spotify', 'apple', 'mixcloud', 'bar23'];
var LOGOS_CONOCIDOS = ['podbar'];

var MAX_URL = 2048;
var MAX_TEXTO = 80;
// La descripción del panel son hasta ~12 palabras en dos líneas.
var MAX_DESCRIPCION = 160;
// Cada propiedad de Apps Script admite ~9 KB: se deja margen.
var MAX_BYTES_JSON = 8500;

/** Agrega el menú personalizado al abrir la hoja. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Le Tiende')
    .addItem('Publicar enlaces', 'publicarEnlaces')
    .addToUi();
}

/**
 * Valida la pestaña y, si no hay errores, publica una copia fija.
 * Nunca escribe una publicación parcial: o todo pasa la validación, o nada
 * se guarda.
 */
function publicarEnlaces() {
  var ui = SpreadsheetApp.getUi();
  var resultado = leerYValidarEnlaces(SpreadsheetApp.getActiveSpreadsheet());

  if (resultado.errores.length > 0) {
    ui.alert(
      'No se publicaron los enlaces',
      'Se encontraron ' + resultado.errores.length + ' error(es). Corrígelos y vuelve a intentar:\n\n' +
        resultado.errores.join('\n'),
      ui.ButtonSet.OK,
    );
    return;
  }

  var publicacion = {
    publicadoEn: new Date().toISOString(),
    paneles: resultado.paneles,
  };
  var json = JSON.stringify(publicacion);
  if (json.length > MAX_BYTES_JSON) {
    ui.alert(
      'No se publicaron los enlaces',
      'La publicación pesa ' + json.length + ' caracteres y el límite es ' + MAX_BYTES_JSON +
        '. Quita enlaces o acorta los textos.',
      ui.ButtonSet.OK,
    );
    return;
  }

  PropertiesService.getDocumentProperties().setProperty(PROP_ENLACES, json);

  var totalBarras = 0;
  var totalEnlaces = 0;
  resultado.paneles.forEach(function (p) {
    totalBarras += p.barras.length;
    p.barras.forEach(function (b) {
      totalEnlaces += b.enlaces.length;
    });
  });
  var mensaje =
    'Publicado: ' + resultado.paneles.length + ' panel(es), ' + totalBarras + ' barra(s), ' +
    totalEnlaces + ' enlace(s).';
  if (resultado.avisos.length > 0) {
    mensaje += '\n\nAvisos (no bloquean la publicación):\n' + resultado.avisos.join('\n');
  }
  ui.alert('Enlaces publicados', mensaje, ui.ButtonSet.OK);
}

/**
 * Lee `enlaces`, valida cada fila y devuelve `{ paneles, errores, avisos }`.
 * Columnas (tech-specs.md §4.7), en cualquier orden y sin importar mayúsculas
 * ni tildes: Categoría | Subcategoría | Icono | Link, y opcionales
 * Descripción | Etiqueta | Visible | Logo. Paneles, barras y enlaces conservan el orden de
 * aparición en la hoja.
 */
function leerYValidarEnlaces(ss) {
  var hoja = ss.getSheetByName(HOJA_ENLACES);
  if (!hoja) {
    return { paneles: [], avisos: [], errores: ['No existe la pestaña "' + HOJA_ENLACES + '".'] };
  }

  var filas = hoja.getDataRange().getValues();
  var encabezado = filas.shift() || [];
  var col = indiceColumnas(encabezado);

  var errores = [];
  var avisos = [];
  var faltantes = ['categoria', 'subcategoria', 'icono', 'link'].filter(function (nombre) {
    return col[nombre] === -1;
  });
  if (faltantes.length > 0) {
    errores.push('Faltan columnas obligatorias en el encabezado: ' + faltantes.join(', ') + '.');
    return { paneles: [], avisos: avisos, errores: errores };
  }

  var paneles = [];
  var panelesPorTitulo = {};
  var patronClave = /^[a-z0-9_]+$/;
  var patronUrl = /^https:\/\/[^\/\s?#]+([\/?#]\S*)?$/i;
  var iconosDesconocidos = {};
  var logosDesconocidos = {};

  filas.forEach(function (fila, i) {
    var numeroFila = i + 2; // +1 por el encabezado, +1 porque las hojas son 1-indexadas
    var categoria = texto(fila, col.categoria);
    var subcategoria = texto(fila, col.subcategoria);
    var icono = texto(fila, col.icono).toLowerCase();
    var url = texto(fila, col.link);
    var descripcion = texto(fila, col.descripcion);
    var etiqueta = texto(fila, col.etiqueta);
    var logo = texto(fila, col.logo).toLowerCase();
    var visibleCrudo = col.visible === -1 ? '' : fila[col.visible];

    if (!categoria && !subcategoria && !icono && !url && !etiqueta && !logo && !descripcion) return; // fila vacía

    var donde = 'Fila ' + numeroFila + ': ';
    var valida = true;

    if (!categoria) { errores.push(donde + 'falta la Categoría.'); valida = false; }
    if (!subcategoria) { errores.push(donde + 'falta la Subcategoría.'); valida = false; }
    if (!icono) {
      errores.push(donde + 'falta el Icono.');
      valida = false;
    } else if (!patronClave.test(icono)) {
      errores.push(donde + 'el Icono "' + icono + '" solo admite letras minúsculas, números y guion bajo.');
      valida = false;
    }
    if (!url) {
      errores.push(donde + 'falta el Link.');
      valida = false;
    } else if (url.length > MAX_URL || !patronUrl.test(url)) {
      errores.push(donde + 'el Link debe ser una dirección completa que empiece por https:// ("' + url.slice(0, 60) + '").');
      valida = false;
    }
    if (categoria.length > MAX_TEXTO || subcategoria.length > MAX_TEXTO || etiqueta.length > MAX_TEXTO) {
      errores.push(donde + 'Categoría, Subcategoría y Etiqueta admiten máximo ' + MAX_TEXTO + ' caracteres.');
      valida = false;
    }
    if (descripcion.length > MAX_DESCRIPCION) {
      errores.push(donde + 'la Descripción admite máximo ' + MAX_DESCRIPCION + ' caracteres (hoy tiene ' + descripcion.length + ').');
      valida = false;
    }
    if (logo && !patronClave.test(logo)) {
      errores.push(donde + 'el Logo "' + logo + '" solo admite letras minúsculas, números y guion bajo.');
      valida = false;
    }
    var visible = interpretarBooleano(visibleCrudo);
    if (visible === null) {
      errores.push(donde + '"Visible" no se puede interpretar como sí/no.');
      valida = false;
    }
    if (!valida) return;

    if (visible === false) return; // oculta: no se publica, y no cuenta para avisos

    if (ICONOS_CONOCIDOS.indexOf(icono) === -1) iconosDesconocidos[icono] = true;
    if (logo && LOGOS_CONOCIDOS.indexOf(logo) === -1) logosDesconocidos[logo] = true;

    var panel = panelesPorTitulo[categoria];
    if (!panel) {
      panel = { titulo: categoria, descripcion: '', logo: null, barras: [] };
      panelesPorTitulo[categoria] = panel;
      paneles.push(panel);
    }
    if (descripcion) {
      if (!panel.descripcion) {
        panel.descripcion = descripcion;
      } else if (panel.descripcion !== descripcion) {
        avisos.push('Fila ' + numeroFila + ': el panel "' + categoria + '" ya tiene descripción; se ignora la de esta fila.');
      }
    }
    if (logo) {
      if (!panel.logo) {
        panel.logo = logo;
      } else if (panel.logo !== logo) {
        avisos.push('Fila ' + numeroFila + ': el panel "' + categoria + '" ya tiene el logo "' + panel.logo + '"; se ignora "' + logo + '".');
      }
    }

    var barra = null;
    panel.barras.forEach(function (b) {
      if (b.titulo === subcategoria) barra = b;
    });
    if (!barra) {
      barra = { titulo: subcategoria, enlaces: [] };
      panel.barras.push(barra);
    }
    var repetido = barra.enlaces.some(function (e) {
      return e.url === url;
    });
    if (repetido) {
      errores.push(donde + 'el Link ya aparece en "' + categoria + ' / ' + subcategoria + '".');
      return;
    }
    barra.enlaces.push({ icono: icono, url: url, etiqueta: etiqueta });
  });

  var sinConocer = Object.keys(iconosDesconocidos);
  if (sinConocer.length > 0) {
    avisos.push('Iconos que el sitio aún no sabe dibujar (saldrá un ícono genérico): ' + sinConocer.join(', '));
  }
  var logosSinConocer = Object.keys(logosDesconocidos);
  if (logosSinConocer.length > 0) {
    avisos.push('Logos que el sitio aún no tiene (el panel mostrará su título): ' + logosSinConocer.join(', '));
  }
  if (errores.length === 0 && paneles.length === 0) {
    errores.push('No hay ningún enlace visible para publicar.');
  }

  return { paneles: paneles, avisos: avisos, errores: errores };
}

/** Sirve la última copia publicada. Sin publicación previa, responde sin paneles. */
function doGet() {
  var guardado = PropertiesService.getDocumentProperties().getProperty(PROP_ENLACES);
  var contenido = guardado ? JSON.parse(guardado) : { publicadoEn: null, paneles: [] };
  return ContentService.createTextOutput(JSON.stringify(contenido)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/** Texto recortado de una celda; -1 (columna ausente) o celda vacía dan ''. */
function texto(fila, indice) {
  if (indice === -1) return '';
  var valor = fila[indice];
  return valor === null || valor === undefined ? '' : String(valor).trim();
}

/** "Categoría " → "categoria": minúsculas, sin tildes ni espacios sobrantes. */
function normalizar(nombre) {
  return String(nombre || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

/** Mapa nombre normalizado → índice de columna (o -1 si la hoja no la trae). */
function indiceColumnas(encabezado) {
  var normalizados = encabezado.map(normalizar);
  var col = {};
  ['categoria', 'subcategoria', 'icono', 'link', 'descripcion', 'etiqueta', 'visible', 'logo'].forEach(function (nombre) {
    col[nombre] = normalizados.indexOf(nombre);
  });
  return col;
}

/** TRUE/FALSE, true/false, 1/0, sí/no → booleano. Vacío: true. Otra cosa: null (no interpretable). */
function interpretarBooleano(valor) {
  if (valor === '' || valor === null || valor === undefined) return true;
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') {
    if (valor === 1) return true;
    if (valor === 0) return false;
    return null;
  }
  var t = normalizar(valor);
  if (t === 'true' || t === 'si' || t === '1') return true;
  if (t === 'false' || t === 'no' || t === '0') return false;
  return null;
}
