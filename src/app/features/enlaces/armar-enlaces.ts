/**
 * Armado de la página de enlaces (tech-specs.md §4.7, T-0041).
 *
 * La fuente es el JSON de la Web App de Apps Script: un tercero para el SSR.
 * Aunque el script ya validó la hoja, aquí se revalida todo (defensa en
 * profundidad, A03): una URL que no sea `https:` jamás llega a un `href`, y
 * una clave de ícono o de logo que el código no conoce nunca se convierte en
 * una ruta de archivo.
 */

/** Claves de ícono que `public/enlaces/icono-<clave>.svg` ya tiene (T-0042). */
export const ICONOS_CONOCIDOS = ['youtube', 'spotify', 'apple', 'mixcloud', 'bar23'] as const;
export type IconoConocido = (typeof ICONOS_CONOCIDOS)[number];

/** Respaldo cuando la hoja trae una clave que el código aún no sabe dibujar. */
export const ICONO_GENERICO = 'enlace';
export type IconoEnlace = IconoConocido | typeof ICONO_GENERICO;

/** Claves de logo de panel que `public/enlaces/logo-<clave>.svg` ya tiene (T-0042). */
export const LOGOS_CONOCIDOS = ['podbar'] as const;
export type LogoConocido = (typeof LOGOS_CONOCIDOS)[number];

/** Nombre accesible cuando la hoja no trae `Etiqueta`. */
export const ETIQUETAS_ICONO: Record<IconoConocido, string> = {
  youtube: 'Ver en YouTube',
  spotify: 'Escuchar en Spotify',
  apple: 'Escuchar en Apple Podcasts',
  mixcloud: 'Escuchar en Mixcloud',
  bar23: 'Visitar bar23.co',
};

export const ETIQUETA_GENERICA = 'Abrir enlace';

const MAXIMO_TEXTO = 80;
// Descripción del panel: hasta ~12 palabras, en dos líneas.
const MAXIMO_DESCRIPCION = 160;

export interface EnlaceArmado {
  readonly icono: IconoEnlace;
  readonly url: string;
  readonly etiqueta: string;
}

export interface BarraArmada {
  readonly titulo: string;
  readonly enlaces: readonly EnlaceArmado[];
}

export interface PanelArmado {
  readonly titulo: string;
  /** Texto corto bajo el logo del panel; `''` si la hoja no trae descripción. */
  readonly descripcion: string;
  readonly logo: LogoConocido | null;
  readonly barras: readonly BarraArmada[];
}

/** Objeto plano (sin Date ni Map): viaja tal cual por `TransferState`. */
export interface EnlacesArmados {
  readonly paneles: readonly PanelArmado[];
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown, maximo = MAXIMO_TEXTO): string {
  return typeof valor === 'string' ? valor.trim().slice(0, maximo) : '';
}

/** `https:` con host y sin credenciales incrustadas; cualquier otra cosa, `null`. */
function urlSegura(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const candidata = valor.trim();
  try {
    const url = new URL(candidata);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
    return candidata;
  } catch {
    return null;
  }
}

function esIconoConocido(clave: string): clave is IconoConocido {
  return (ICONOS_CONOCIDOS as readonly string[]).includes(clave);
}

function esLogoConocido(clave: string): clave is LogoConocido {
  return (LOGOS_CONOCIDOS as readonly string[]).includes(clave);
}

function armarEnlace(crudo: unknown): EnlaceArmado | null {
  if (!esObjeto(crudo) || crudo['visible'] === false) return null;
  const url = urlSegura(crudo['url']);
  if (!url) return null;

  const clave = texto(crudo['icono']).toLowerCase();
  const icono: IconoEnlace = esIconoConocido(clave) ? clave : ICONO_GENERICO;
  const etiqueta =
    texto(crudo['etiqueta']) ||
    (esIconoConocido(clave) ? ETIQUETAS_ICONO[clave] : ETIQUETA_GENERICA);
  return { icono, url, etiqueta };
}

function armarBarra(crudo: unknown): BarraArmada | null {
  if (!esObjeto(crudo) || !Array.isArray(crudo['enlaces'])) return null;
  const enlaces = crudo['enlaces']
    .map(armarEnlace)
    .filter((enlace): enlace is EnlaceArmado => enlace !== null);
  const titulo = texto(crudo['titulo']);
  return titulo && enlaces.length > 0 ? { titulo, enlaces } : null;
}

function armarPanel(crudo: unknown): PanelArmado | null {
  if (!esObjeto(crudo) || !Array.isArray(crudo['barras'])) return null;
  const barras = crudo['barras']
    .map(armarBarra)
    .filter((barra): barra is BarraArmada => barra !== null);
  const titulo = texto(crudo['titulo']);
  if (!titulo || barras.length === 0) return null;

  const clave = texto(crudo['logo']).toLowerCase();
  return {
    titulo,
    descripcion: texto(crudo['descripcion'], MAXIMO_DESCRIPCION),
    logo: esLogoConocido(clave) ? clave : null,
    barras,
  };
}

/**
 * Convierte el JSON de la Web App en lo que pinta la página. Conserva el
 * orden de la fuente; descarta enlaces inválidos u ocultos, barras sin
 * enlaces y paneles sin barras. Una fuente irreconocible da cero paneles.
 */
export function armarEnlaces(contenido: unknown): EnlacesArmados {
  if (!esObjeto(contenido) || !Array.isArray(contenido['paneles'])) return { paneles: [] };
  const paneles = contenido['paneles']
    .map(armarPanel)
    .filter((panel): panel is PanelArmado => panel !== null);
  return { paneles };
}
