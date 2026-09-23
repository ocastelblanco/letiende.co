import { Injectable, PLATFORM_ID, RESPONSE_INIT, inject, resource } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { environment } from '@environments/environment';
import {
  CartaArmada,
  ContenidoCarta,
  MenuComandante,
  armarCarta,
} from '@features/carta/armar-carta';
import { EntradaCache, leerConCache } from './carta-cache';

/** 5 minutos — tech-specs.md §4.6: "la Web App de Google tarda 1 a 3 s en frío". */
const TTL_CACHE_MS = 5 * 60 * 1000;

// A nivel de módulo, no de la clase: tiene que sobrevivir entre peticiones
// dentro de la misma Lambda caliente (mismo patrón que `peticionesPorIp` en
// server/api/handlers/contacto.ts), no solo durante la vida de un
// componente o de una petición SSR individual.
const cacheMenu = new Map<string, EntradaCache<MenuComandante>>();
const cacheContenido = new Map<string, EntradaCache<ContenidoCarta>>();

async function obtenerJson<T>(url: string): Promise<T> {
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`HTTP ${respuesta.status} al leer ${url}`);
  }
  return (await respuesta.json()) as T;
}

/**
 * Lee las dos fuentes de la carta del café bar (tech-specs.md §4.6) y las
 * arma con `armarCarta()`. A diferencia de `EventosPublicosService`, no usa
 * `httpResource()`: necesita una caché con TTL que sobreviva entre
 * peticiones dentro de la misma Lambda, algo ajeno al ciclo de vida de una
 * petición SSR individual — por eso el `fetch()` nativo (Node 24, sigue
 * redirecciones por defecto, necesario porque la Web App de Apps Script
 * redirige a `script.googleusercontent.com`) y la caché de
 * `carta-cache.ts`, en vez del `HttpClient` que `httpResource()` exige.
 */
@Injectable({ providedIn: 'root' })
export class CartaService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly respuestaInit = inject(RESPONSE_INIT, { optional: true });

  readonly carta = resource<CartaArmada | null, void>({
    loader: async () => {
      // Se lee solo en el servidor (§4.6): el navegador recibe la carta ya
      // armada en el HTML del SSR, y esta caché en memoria de proceso no
      // tendría sentido repetida por cada visitante.
      if (!isPlatformServer(this.platformId)) return null;

      let menu: MenuComandante;
      try {
        menu = await leerConCache(cacheMenu, 'menu', TTL_CACHE_MS, () =>
          obtenerJson<MenuComandante>(environment.urlMenuComandante),
        );
      } catch {
        // Sin `menu.json` y sin copia buena en caché no hay carta que
        // mostrar: 503 real, nunca una página vacía con 200 (ADR-013).
        if (this.respuestaInit) this.respuestaInit.status = 503;
        return null;
      }

      let contenido: ContenidoCarta | null = null;
      if (environment.urlContenidoCartaWebApp) {
        try {
          contenido = await leerConCache(cacheContenido, 'contenido', TTL_CACHE_MS, () =>
            obtenerJson<ContenidoCarta>(environment.urlContenidoCartaWebApp),
          );
        } catch {
          // Degradación, nunca bloqueo (§4.6): sin contenido editorial la
          // carta se arma igual — armarCarta() ya resuelve los respaldos.
          contenido = null;
        }
      }

      return armarCarta(menu, contenido);
    },
  });
}

/**
 * Solo para pruebas (`carta.service.spec.ts`): las cachés viven a nivel de
 * módulo a propósito (sobreviven entre peticiones dentro de la misma
 * Lambda), así que sin esto quedarían compartidas entre casos de prueba.
 */
export function _reiniciarCacheCartaParaPruebas(): void {
  cacheMenu.clear();
  cacheContenido.clear();
}
