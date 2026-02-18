import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Evento, FormaPagoItem } from '@servicios/datos';
import { Calendario } from '@servicios/calendario';
import { EventoMedia } from '@componentes/evento-media';
import { TagModule } from '@modulos/primeng/primeng-module';

@Component({
  selector: 'lt-evento-card',
  imports: [EventoMedia, TagModule, CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './evento-card.html',
  styleUrl: './evento-card.scss'
})
export class EventoCard {
  readonly evento = input.required<Evento>();
  readonly idioma = input<string>('ES');

  readonly enlaceGoogleCalendar = computed<string>(() => {
    return Calendario.generarEnlaceGoogleCalendar(this.evento());
  });

  readonly enlaceICS = computed<string>(() => {
    const contenido: string = Calendario.generarArchivoIcs(this.evento());
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(contenido);
  });

  readonly porcentajeVendido = computed<number>(() => {
    const ev: Evento = this.evento();
    if (ev.capacidad === 0) return 0;
    return ((ev.capacidad - ev.entradas_disponibles) / ev.capacidad) * 100;
  });

  readonly severidadDisponibilidad = computed<'danger' | 'warn' | 'success'>(() => {
    const porcentaje: number = this.porcentajeVendido();
    if (porcentaje >= 90) return 'danger';
    if (porcentaje >= 70) return 'warn';
    return 'success';
  });

  readonly localeIdioma = computed<string>(() => {
    return this.idioma().toLowerCase() === 'es' ? 'es-CO' : 'en-US';
  });

  esES(): boolean {
    return this.idioma().toLowerCase() === 'es';
  }

  obtenerTextoFormaPago(formaPago: FormaPagoItem): string {
    const textos: Record<FormaPagoItem['tipo'], Record<string, string>> = {
      atrapalo: { es: 'Atrápalo', en: 'Atrápalo' },
      letiende: { es: 'Le Tiende', en: 'Le Tiende' },
      whatsapp: { es: 'WhatsApp', en: 'WhatsApp' },
      telefono: { es: 'Teléfono', en: 'Phone' },
    };
    const lang: string = this.idioma().toLowerCase();
    let texto: string = textos[formaPago.tipo]?.[lang] || formaPago.tipo;
    if (formaPago.telefono) {
      texto += ` (${formaPago.telefono})`;
    }
    return texto;
  }
}
