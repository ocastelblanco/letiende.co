import {
  Injectable,
  PLATFORM_ID,
  RESPONSE_INIT,
  TransferState,
  inject,
  makeStateKey,
  resource,
} from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { environment } from '@environments/environment';
import { EnlacesArmados, armarEnlaces } from '@features/enlaces/armar-enlaces';
import { EntradaCache, leerConCache } from './carta-cache';

/** 5 minutos — tech-specs.md §4.7: la Web App de Google tarda 1 a 3 s en frío. */
const TTL_CACHE_MS = 5 * 60 * 1000;

/** Lleva los enlaces armados del SSR al navegador (objeto plano: sin Date ni Map). */
export const CLAVE_ENLACES = makeStateKey<EnlacesArmados>('enlaces-armados');

// A nivel de módulo, no de la clase: tiene que sobrevivir entre peticiones
// dentro de la misma Lambda caliente (mismo patrón que `CartaService`).
const cacheEnlaces = new Map<string, EntradaCache<EnlacesArmados>>();

async function obtenerEnlaces(url: string): Promise<EnlacesArmados> {
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`HTTP ${respuesta.status} al leer los enlaces`);
  }
  return armarEnlaces(await respuesta.json());
}

/**
 * Lee la Web App de Apps Script de la hoja de enlaces (tech-specs.md §4.7) y
 * la arma con `armarEnlaces()`. Mismo diseño que `CartaService` y por las
 * mismas razones: `fetch()` nativo (sigue la redirección de Apps Script),
 * caché con TTL y última copia buena a nivel de módulo, y `TransferState`
 * explícito, porque `resource()` no usa la transfer cache de `HttpClient`
 * y sin él la hidratación borraría la página (defecto real de T-0038).
 */
@Injectable({ providedIn: 'root' })
export class EnlacesService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly respuestaInit = inject(RESPONSE_INIT, { optional: true });
  private readonly estadoTransferido = inject(TransferState);

  readonly enlaces = resource<EnlacesArmados | null, void>({
    loader: async () => {
      // Solo el servidor lee la fuente: el navegador recibe lo ya armado.
      if (!isPlatformServer(this.platformId)) {
        return this.estadoTransferido.get(CLAVE_ENLACES, null);
      }

      try {
        // La URL es una constante del entorno, nunca algo armado con la
        // petición (A10, SSRF). Vacía = aún no desplegada: cae en el catch.
        const url = environment.urlContenidoEnlacesWebApp;
        if (!url) throw new Error('urlContenidoEnlacesWebApp sin configurar');

        const enlaces = await leerConCache(cacheEnlaces, 'enlaces', TTL_CACHE_MS, () =>
          obtenerEnlaces(url),
        );
        this.estadoTransferido.set(CLAVE_ENLACES, enlaces);
        return enlaces;
      } catch {
        // Sin fuente y sin copia buena en caché: 503 real, nunca una página
        // vacía con 200 (ADR-013). El navegador queda con null, igual que el SSR.
        if (this.respuestaInit) this.respuestaInit.status = 503;
        return null;
      }
    },
  });
}

/**
 * Solo para pruebas (`enlaces.service.spec.ts`): la caché vive a nivel de
 * módulo a propósito, así que sin esto quedaría compartida entre casos.
 */
export function _reiniciarCacheEnlacesParaPruebas(): void {
  cacheEnlaces.clear();
}
