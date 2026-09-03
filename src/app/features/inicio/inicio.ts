import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EventosPublicosService } from '@core/api/eventos-publicos.service';
import { MetaService } from '@core/seo/meta.service';
import { JsonLdService } from '@core/seo/json-ld.service';
import { esquemaListaEventos, esquemaLocalBusiness } from '@core/seo/esquemas';

@Component({
  selector: 'app-inicio',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inicio.html',
})
export class InicioComponent {
  private readonly eventosPublicos = inject(EventosPublicosService);
  private readonly meta = inject(MetaService);
  private readonly jsonLd = inject(JsonLdService);

  // httpResource().value() LANZA cuando el recurso está en estado de error
  // (verificado en vivo, no es teoría de la documentación de Angular) — un
  // ?? no lo detiene, porque el error salta antes de llegar al operador.
  // hasValue() es la única forma no explosiva de leerlo: si Ágora está
  // caída, la portada se queda sin esta sección en vez de romper el SSR
  // entero (tech-specs.md §5).
  protected readonly proximosEventos = computed(() => {
    const recurso = this.eventosPublicos.cartelera;
    return recurso.hasValue() ? recurso.value().slice(0, 3) : [];
  });

  constructor() {
    this.meta.actualizar({
      titulo: 'Le Tiende',
      descripcion:
        'Centro cultural en Bogotá: teatro, librería y café bar en un mismo local. Cartelera, catálogo y ubicación en un solo sitio.',
      ruta: '/',
    });

    // effect(), no una llamada única en el constructor: proximosEventos()
    // llega después del primer render (httpResource es asíncrono) — el
    // JSON-LD tiene que reflejar los eventos reales, no quedarse vacío.
    effect(() => {
      const eventos = this.proximosEventos();
      this.jsonLd.establecer(
        'ld-pagina',
        eventos.length > 0
          ? [esquemaLocalBusiness(), esquemaListaEventos(eventos)]
          : [esquemaLocalBusiness()],
      );
    });
  }
}
