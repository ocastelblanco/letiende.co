import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, inject, OnInit, Signal, signal } from '@angular/core';
import { ImagenFondo } from '@componentes/imagen-fondo';
import { EventoCard } from '@componentes/evento-card/evento-card';
import { PrimengModule } from '@modulos/primeng/primeng-module';
import { LtConfig } from '@servicios/lt-config';
import { MetaService } from '@servicios/meta';
import { BreakpointService, BreakpointSize } from '@servicios/breakpoint-service';
import { Datos, Evento, EventosIdioma, EventosResponse } from '@servicios/datos';

@Component({
  selector: 'lt-eventos',
  imports: [PrimengModule, ImagenFondo, EventoCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './eventos.html',
  styleUrl: './eventos.scss'
})
export class Eventos implements OnInit {
  private readonly config: LtConfig = inject(LtConfig);
  private readonly meta: MetaService = inject(MetaService);
  private readonly breakpointServicio: BreakpointService = inject(BreakpointService);
  private readonly datos: Datos = inject(Datos);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  readonly bp: Signal<BreakpointSize> = computed(() => this.breakpointServicio.getCurrentBreakpoint());
  readonly idioma: Signal<string> = computed(() => this.config.idioma());
  readonly modoTema = signal<string>('light');
  readonly eventosCompleto = signal<EventosResponse | null>(null);

  readonly eventosIdioma = computed<EventosIdioma | null>(() => {
    const data: EventosResponse | null = this.eventosCompleto();
    if (!data?.idiomas) return null;
    const lang: string = this.idioma().toLowerCase();
    return lang === 'es' ? data.idiomas.es : data.idiomas.en;
  });

  readonly eventosFuturos = computed<Evento[]>(() => {
    const idiomaData: EventosIdioma | null = this.eventosIdioma();
    if (!idiomaData) return [];
    const ahora: number = Date.now();
    return idiomaData.eventos
      .filter((ev: Evento) => new Date(ev.fecha_inicio).getTime() > ahora)
      .sort((a: Evento, b: Evento) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());
  });

  constructor() {
    effect(() => this.modoTema.set(this.config.modoTema()));
  }

  ngOnInit(): void {
    this.meta.updatePageMeta({
      title: 'Eventos - Le Teatre',
      description: 'Descubre los proximos eventos en Le Teatre: conciertos, teatro, danza, cine y mas en el Parkway de Bogota.',
      keywords: 'eventos,conciertos,teatro,danza,cine,Le Tiende,Le Teatre,parkway,Bogota',
      image: 'https://assets.letiende.co/logos/logo_sobre_amarillo_sin_fondo.png',
      url: 'https://letiende.co/eventos',
      type: 'website',
      siteName: 'Le Tiende',
      canonical: 'https://letiende.co/eventos',
      noindex: false,
      nofollow: false,
    });
    this.datos.getEventos().subscribe((response: EventosResponse) => {
      this.eventosCompleto.set(response);
      this.cdr.detectChanges();
    });
  }
}
