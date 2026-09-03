import { Injectable, afterNextRender } from '@angular/core';
import { environment } from '@environments/environment';

/**
 * Este proyecto despliega el mismo artefacto a staging y a producción
 * (docs/MEMORY.md, environment.production.ts): sin este chequeo, cada visita
 * de prueba en staging.letiende.co contaría como tráfico real en la
 * propiedad de GA4. Solo el host de producción carga gtag.js.
 */
const HOST_PRODUCCION = 'letiende.co';

export function debeCargarAnalytics(hostname: string): boolean {
  return hostname === HOST_PRODUCCION;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * Reemplazo de la integración legacy (Universal Analytics, descontinuada) por
 * Google Analytics 4 vía gtag.js. Se carga con `afterNextRender` para que
 * nunca se ejecute durante el SSR (no hay `window` en el servidor) y para no
 * bloquear el primer render con un script de un tercero.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor() {
    afterNextRender(() => this.cargarSiEsProduccion());
  }

  private cargarSiEsProduccion(): void {
    const id = environment.googleAnalyticsId;
    // El marcador '__GOOGLE_ANALYTICS_ID__' sin sustituir significa que este
    // build no pasó por scripts/inyectar-llaves-publicas.mjs (desarrollo
    // local, o CI sin la variable de entorno configurada) — no hay ID real
    // que cargar.
    if (!id || id.startsWith('__') || !debeCargarAnalytics(window.location.hostname)) {
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer ?? [];
    const gtag = (...args: unknown[]) => window.dataLayer?.push(args);
    gtag('js', new Date());
    gtag('config', id);
  }
}
