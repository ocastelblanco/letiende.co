/**
 * Caché en memoria del proceso de la Lambda, con la última copia buena como
 * respaldo (tech-specs.md §4.6): "si una lectura falla, se sirve la última
 * copia buena en memoria". Mismo patrón que `peticionesPorIp` en
 * `server/api/handlers/contacto.ts` — un `Map` a nivel de módulo, que
 * sobrevive entre invocaciones calientes de la misma Lambda, pero es ajeno
 * por completo a Angular (sin DI, para poder probarlo sin `TestBed`).
 *
 * `CartaService` (T-0037) es el único que crea los `Map` reales; este
 * archivo solo aporta la función pura que sabe leerlos con TTL y respaldo.
 */

export interface EntradaCache<T> {
  readonly valor: T;
  readonly timestampMs: number;
}

/**
 * Devuelve el valor cacheado si todavía está fresco; si no, ejecuta
 * `cargar()` y actualiza la caché. Si `cargar()` falla:
 * - con una entrada previa (aunque esté vencida), la devuelve — nunca se
 *   cae por culpa de una lectura fallida cuando hay algo bueno guardado;
 * - sin ninguna entrada previa, relanza el error: quien llama decide qué
 *   hacer ante la primera lectura fallida (`CartaService`).
 */
export async function leerConCache<T>(
  cache: Map<string, EntradaCache<T>>,
  clave: string,
  ttlMs: number,
  cargar: () => Promise<T>,
  ahoraMs: () => number = Date.now,
): Promise<T> {
  const entrada = cache.get(clave);
  const ahora = ahoraMs();

  if (entrada && ahora - entrada.timestampMs < ttlMs) {
    return entrada.valor;
  }

  try {
    const valor = await cargar();
    cache.set(clave, { valor, timestampMs: ahora });
    return valor;
  } catch (error) {
    if (entrada) return entrada.valor;
    throw error;
  }
}
