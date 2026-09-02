import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EventosPublicosService } from '@core/api/eventos-publicos.service';

@Component({
  selector: 'app-inicio',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inicio.html',
})
export class InicioComponent {
  private readonly eventosPublicos = inject(EventosPublicosService);

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
}
