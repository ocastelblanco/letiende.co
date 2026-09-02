/**
 * Dirección y horarios reales de Le Tiende, dados por el humano el 02/09/2026
 * (no hay fuente automática todavía — ver docs/MEMORY.md ADR sobre Google
 * Business Profile). Única fuente de verdad: la usan PiePagina, Nosotros y
 * Contacto, para no repetir el dato en tres archivos.
 */
export const DATOS_NEGOCIO = {
  nombre: 'Le Tiende',
  direccion: 'Carrera 24 #37-44, Bogotá, Colombia',
  horarios: [
    { dias: 'Domingo a miércoles', horario: '2:00 p. m. – 8:00 p. m.' },
    { dias: 'Jueves a sábado', horario: '2:00 p. m. – 10:00 p. m.' },
  ],
} as const;
