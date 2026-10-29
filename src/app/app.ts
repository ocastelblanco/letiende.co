import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { BarraNavegacion } from '@shared/navegacion/barra-navegacion';
import { PiePagina } from '@shared/navegacion/pie-pagina';
import { AnalyticsService } from '@core/analytics/analytics.service';
import { JsonLdService } from '@core/seo/json-ld.service';
import { esquemaOrganizacion, esquemaSitioWeb } from '@core/seo/esquemas';

/** `true` si la ruta activa (la más profunda) declara `data: { sinMarco: true }`. */
function rutaSinMarco(raiz: ActivatedRouteSnapshot): boolean {
  let ruta: ActivatedRouteSnapshot | null = raiz;
  let sinMarco = false;
  while (ruta) {
    sinMarco = ruta.data['sinMarco'] === true;
    ruta = ruta.firstChild;
  }
  return sinMarco;
}

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
  private readonly router = inject(Router);

  // El valor inicial sale del estado del router, no de `false`: la navegación
  // inicial ya terminó (es bloqueante) y servidor y navegador deben pintar lo
  // mismo en el primer render (ADR-027).
  protected readonly sinMarco = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map(() => rutaSinMarco(this.router.routerState.snapshot.root)),
    ),
    { initialValue: rutaSinMarco(this.router.routerState.snapshot.root) },
  );

  constructor() {
    // Organization + WebSite: en todas las páginas, se fija una sola vez
    // (tech-specs.md §4.5) — cada página agrega su propio bloque aparte.
    this.jsonLd.establecer('ld-organizacion', [esquemaOrganizacion(), esquemaSitioWeb()]);
  }
}
