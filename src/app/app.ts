import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BarraNavegacion } from '@shared/navegacion/barra-navegacion';
import { PiePagina } from '@shared/navegacion/pie-pagina';
import { AnalyticsService } from '@core/analytics/analytics.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BarraNavegacion, PiePagina],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  // La inyección basta para construir el singleton y disparar su
  // afterNextRender interno — ver AnalyticsService.
  private readonly analytics = inject(AnalyticsService);
}
