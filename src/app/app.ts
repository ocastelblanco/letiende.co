import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BarraNavegacion } from '@shared/navegacion/barra-navegacion';
import { PiePagina } from '@shared/navegacion/pie-pagina';
import { AnalyticsService } from '@core/analytics/analytics.service';
import { JsonLdService } from '@core/seo/json-ld.service';
import { esquemaOrganizacion, esquemaSitioWeb } from '@core/seo/esquemas';

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
  private readonly jsonLd = inject(JsonLdService);

  constructor() {
    // Organization + WebSite: en todas las páginas, se fija una sola vez
    // (tech-specs.md §4.5) — cada página agrega su propio bloque aparte.
    this.jsonLd.establecer('ld-organizacion', [esquemaOrganizacion(), esquemaSitioWeb()]);
  }
}
