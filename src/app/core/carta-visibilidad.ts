/**
 * Bloqueo EDITORIAL de `/carta` hasta su publicación real (ADR-024,
 * tech-specs.md §4.6). NO es un control de seguridad (CLAUDE.md §5, A01): la
 * carta no tiene nada secreto, solo aún no está aprobada para el público.
 */
export const CARTA_PUBLICADA = false;

const HOSTS_SIEMPRE_VISIBLES: readonly string[] = ['staging.letiende.co', 'localhost', '127.0.0.1'];

// `publicada` existe solo para probar el caso `true` sin mutar la constante.
export function cartaVisible(host: string, publicada = CARTA_PUBLICADA): boolean {
  return publicada || HOSTS_SIEMPRE_VISIBLES.includes(host);
}

/**
 * Mismo criterio de host que `/robots.txt` en `server.ts`: la cabecera
 * `x-le-tiende-host` (la pone CloudFront) o, si falta, el host de la petición.
 * Sin `request` (navegador) usa `location`: la hidratación re-ejecuta el
 * constructor y debe dar el mismo resultado que el servidor.
 */
export function resolverHostCarta(request: Request | null): string {
  if (request) {
    const cabecera = request.headers.get('x-le-tiende-host');
    return cabecera ? cabecera.split(':')[0] : new URL(request.url).hostname;
  }
  return globalThis.location?.hostname ?? '';
}
