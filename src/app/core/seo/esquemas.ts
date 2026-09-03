import type { EventoEnCartelera } from '@core/api/eventos-publicos.service';
import { DATOS_NEGOCIO } from '@core/negocio/datos-negocio';
import { DOMINIO } from './dominio';

export interface MigaDePan {
  readonly nombre: string;
  /** Ruta relativa, p.ej. '/nosotros'. */
  readonly ruta: string;
}

function direccionPostal() {
  return {
    '@type': 'PostalAddress',
    streetAddress: DATOS_NEGOCIO.calle,
    addressLocality: DATOS_NEGOCIO.ciudad,
    addressCountry: DATOS_NEGOCIO.paisCodigoIso,
  };
}

function horariosSchemaOrg() {
  return DATOS_NEGOCIO.horarios.map((bloque) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [...bloque.diasSchemaOrg],
    opens: bloque.abre,
    closes: bloque.cierra,
  }));
}

/** Presente en todas las páginas — tech-specs.md §4.5. */
export function esquemaOrganizacion() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: DATOS_NEGOCIO.nombre,
    url: DOMINIO,
    logo: `${DOMINIO}/logo_negro_sin_fondo.svg`,
  };
}

/**
 * Presente en todas las páginas — tech-specs.md §4.5. Sin `potentialAction`
 * (`SearchAction`): la planeación original lo daba por hecho, pero este
 * sitio no tiene una función de búsqueda real todavía — declarar una que no
 * existe es el mismo error que T-0005 encontró con los campos adivinados de
 * `EventoEnCartelera` (ver docs/MEMORY.md).
 */
export function esquemaSitioWeb() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: DATOS_NEGOCIO.nombre,
    url: DOMINIO,
  };
}

/**
 * `/` y `/contacto` (tech-specs.md §4.5). Sin `geo`: no hay coordenadas
 * verificadas, y `geo` es opcional en schema.org — inventarlas violaría
 * CLAUDE.md ("no inventar hechos"). Sin `telephone`: tampoco se dio uno.
 */
export function esquemaLocalBusiness() {
  return {
    '@context': 'https://schema.org',
    '@type': 'PerformingArtsTheater',
    name: DATOS_NEGOCIO.nombre,
    url: DOMINIO,
    address: direccionPostal(),
    openingHoursSpecification: horariosSchemaOrg(),
  };
}

/**
 * `/` — próximos eventos como `ItemList` de `Event` (tech-specs.md §4.5).
 * No duplica las fichas propias de Ágora (`/cartelera/evento/:slug`, donde
 * Ágora ya emite su propio `Event`): esto describe el resumen que aparece
 * en la portada de este sitio, contenido propio del contenedor. `location`
 * es siempre el mismo teatro — Ágora no rastrea un lugar por evento porque
 * todos ocurren en Le Tiende (tech-specs.md §4.3).
 */
export function esquemaListaEventos(eventos: readonly EventoEnCartelera[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: eventos.map((evento, indice) => ({
      '@type': 'ListItem',
      position: indice + 1,
      item: {
        '@type': 'Event',
        name: evento.nombre,
        startDate: evento.fechaHora,
        url: `${DOMINIO}/cartelera/evento/${evento.slug}`,
        location: {
          '@type': 'Place',
          name: DATOS_NEGOCIO.nombre,
          address: direccionPostal(),
        },
        ...(evento.imagenUrl ? { image: evento.imagenUrl } : {}),
      },
    })),
  };
}

/** `/nosotros` — tech-specs.md §4.5. */
export function esquemaAboutPage() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Nosotros',
    url: `${DOMINIO}/nosotros`,
    about: { '@type': 'Organization', name: DATOS_NEGOCIO.nombre },
  };
}

/** `/contacto` — tech-specs.md §4.5. */
export function esquemaContactPage() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contacto',
    url: `${DOMINIO}/contacto`,
  };
}

/** `/preguntas-frecuentes` — tech-specs.md §4.5. */
export function esquemaFaqPage(preguntas: readonly { pregunta: string; respuesta: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: preguntas.map((p) => ({
      '@type': 'Question',
      name: p.pregunta,
      acceptedAnswer: {
        '@type': 'Answer',
        text: p.respuesta,
      },
    })),
  };
}

/** Cualquier ruta con jerarquía real bajo `/` — tech-specs.md §4.5. */
export function esquemaMigasDePan(migas: readonly MigaDePan[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: migas.map((miga, indice) => ({
      '@type': 'ListItem',
      position: indice + 1,
      name: miga.nombre,
      item: `${DOMINIO}${miga.ruta}`,
    })),
  };
}
