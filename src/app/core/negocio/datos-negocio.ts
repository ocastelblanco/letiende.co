/**
 * Dirección y horarios reales de Le Tiende, dados por el humano el 02/09/2026
 * (no hay fuente automática todavía — ver docs/MEMORY.md ADR-016). Única
 * fuente de verdad: la usan PiePagina, Contacto y los esquemas JSON-LD de
 * core/seo/ (T-0008), para no repetir el dato ni su forma estructurada en
 * varios archivos.
 *
 * `diasSchemaOrg`/`abre`/`cierra` son la forma que exige
 * `OpeningHoursSpecification` de schema.org (días en inglés, horas en
 * formato 24h) — separada de `diasEs`/`horarioEs`, que es lo que se muestra
 * al visitante. Ambas se derivan de los mismos horarios reales, nunca se
 * escriben por separado.
 */
export const DATOS_NEGOCIO = {
  nombre: 'Le Tiende',
  direccion: 'Carrera 24 #37-44, Bogotá, Colombia',
  calle: 'Carrera 24 #37-44',
  ciudad: 'Bogotá',
  paisCodigoIso: 'CO',
  horarios: [
    {
      diasEs: 'Domingo a miércoles',
      horarioEs: '2:00 p. m. – 8:00 p. m.',
      diasSchemaOrg: ['Sunday', 'Monday', 'Tuesday', 'Wednesday'],
      abre: '14:00',
      cierra: '20:00',
    },
    {
      diasEs: 'Jueves a sábado',
      horarioEs: '2:00 p. m. – 10:00 p. m.',
      diasSchemaOrg: ['Thursday', 'Friday', 'Saturday'],
      abre: '14:00',
      cierra: '22:00',
    },
  ],
} as const;
