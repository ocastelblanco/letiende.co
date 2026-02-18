import { Evento } from './datos';

/**
 * Servicio utilitario estático para generar enlaces Google Calendar
 * y archivos .ics para agregar eventos a calendarios
 */
export class Calendario {
  /**
   * Genera un enlace de Google Calendar con los datos del evento
   * @param evento Objeto Evento con información del evento
   * @param idioma Idioma para los títulos ('es' o 'en')
   * @returns URL de Google Calendar
   */
  static generarEnlaceGoogleCalendar(evento: Evento, idioma: 'es' | 'en' = 'es'): string {
    const titulo: string = encodeURIComponent(evento.titulo);
    const descripcion: string = encodeURIComponent(evento.descripcion);
    const ubicacion: string = encodeURIComponent(evento.ubicacion);

    // Convertir fechas ISO a formato Google Calendar (YYYYMMDDTHHmmssZ)
    const fechaInicio: string = this.formatearFechaGoogleCalendar(evento.fecha_inicio);
    const fechaFin: string = this.formatearFechaGoogleCalendar(evento.fecha_fin);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${fechaInicio}/${fechaFin}&details=${descripcion}&location=${ubicacion}`;
  }

  /**
   * Genera un contenido de archivo .ics (iCalendar) para el evento
   * @param evento Objeto Evento con información del evento
   * @returns Contenido del archivo .ics
   */
  static generarArchivoIcs(evento: Evento): string {
    const uid: string = `${evento.id}@letiende.co`;
    const fechaCreacion: string = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const fechaInicio: string = this.formatearFechaIcs(evento.fecha_inicio);
    const fechaFin: string = this.formatearFechaIcs(evento.fecha_fin);

    const contenido: string = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Le Tiende//Le Teatre//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${fechaCreacion}
DTSTART:${fechaInicio}
DTEND:${fechaFin}
SUMMARY:${this.escaparTextoIcs(evento.titulo)}
DESCRIPTION:${this.escaparTextoIcs(evento.descripcion)}
LOCATION:${this.escaparTextoIcs(evento.ubicacion)}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

    return contenido;
  }

  /**
   * Descarga un archivo .ics en el navegador del usuario
   * @param evento Objeto Evento con información del evento
   */
  static descargarArchivoIcs(evento: Evento): void {
    const contenido: string = this.generarArchivoIcs(evento);
    const blob: Blob = new Blob([contenido], { type: 'text/calendar;charset=utf-8' });
    const enlace: HTMLAnchorElement = document.createElement('a');
    const url: string = URL.createObjectURL(blob);

    enlace.setAttribute('href', url);
    enlace.setAttribute('download', `${evento.id}_${evento.titulo.replace(/\s+/g, '_')}.ics`);
    enlace.style.visibility = 'hidden';

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    URL.revokeObjectURL(url);
  }

  /**
   * Formatea una fecha ISO al formato de Google Calendar (YYYYMMDDTHHmmssZ)
   * @param fecha Fecha en formato ISO string
   * @returns Fecha formateada para Google Calendar
   */
  private static formatearFechaGoogleCalendar(fecha: string): string {
    const date: Date = new Date(fecha);
    const año: string = date.getUTCFullYear().toString();
    const mes: string = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const dia: string = date.getUTCDate().toString().padStart(2, '0');
    const hora: string = date.getUTCHours().toString().padStart(2, '0');
    const minuto: string = date.getUTCMinutes().toString().padStart(2, '0');
    const segundo: string = date.getUTCSeconds().toString().padStart(2, '0');

    return `${año}${mes}${dia}T${hora}${minuto}${segundo}Z`;
  }

  /**
   * Formatea una fecha ISO al formato iCalendar (YYYYMMDDTHHmmssZ)
   * @param fecha Fecha en formato ISO string
   * @returns Fecha formateada para iCalendar
   */
  private static formatearFechaIcs(fecha: string): string {
    const date: Date = new Date(fecha);
    const año: string = date.getUTCFullYear().toString();
    const mes: string = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const dia: string = date.getUTCDate().toString().padStart(2, '0');
    const hora: string = date.getUTCHours().toString().padStart(2, '0');
    const minuto: string = date.getUTCMinutes().toString().padStart(2, '0');
    const segundo: string = date.getUTCSeconds().toString().padStart(2, '0');

    return `${año}${mes}${dia}T${hora}${minuto}${segundo}Z`;
  }

  /**
   * Escapa caracteres especiales en el formato iCalendar
   * @param texto Texto a escapar
   * @returns Texto escapado
   */
  private static escaparTextoIcs(texto: string): string {
    return texto
      .replace(/\\/g, '\\\\')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
      .trim();
  }
}
