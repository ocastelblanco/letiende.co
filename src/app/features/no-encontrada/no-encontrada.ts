import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MetaService } from '@core/seo/meta.service';

/**
 * Ruta comodín (tech-specs.md §4.2) — el estado 404 real lo fija
 * `app.routes.server.ts` (`status: 404`), no este componente: una página de
 * "no encontrada" que responde HTTP 200 hace que los buscadores indexen
 * basura (CLAUDE.md §5, A05).
 */
@Component({
  selector: 'app-no-encontrada',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './no-encontrada.html',
})
export class NoEncontradaComponent {
  private readonly meta = inject(MetaService);

  constructor() {
    this.meta.actualizar({
      titulo: 'Página no encontrada - Le Tiende',
      descripcion: 'La página que buscas no existe.',
      ruta: '/404',
    });
  }
}
