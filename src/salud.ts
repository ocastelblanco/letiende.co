/**
 * Prueba de humo del despliegue (tech-specs.md §5 y §10): `GET /api/salud`.
 * Responde 200 sin consultar a Ágora, Babel ni Comandante: es la salud de ESTE
 * contenedor, y una dependencia caída no debe tumbar el despliegue. No
 * devuelve versiones, rutas ni variables de entorno (CLAUDE.md §5, A05), y
 * `no-store` evita que CloudFront cachee un resultado viejo.
 */
export interface RespuestaSalud {
  set(campo: string, valor: string): unknown;
  json(cuerpo: unknown): unknown;
}

export function responderSalud(_req: unknown, res: RespuestaSalud): void {
  res.set('Cache-Control', 'no-store');
  res.json({ estado: 'ok' });
}
