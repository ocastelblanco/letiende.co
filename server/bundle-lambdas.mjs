import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';

/**
 * Empaqueta con esbuild las Lambdas que dependen de algún paquete real de
 * `node_modules` en tiempo de ejecución, en vez de copiar un subconjunto de
 * `node_modules/**` a mano en `serverless.yml` — mismo motivo, verificado en
 * producción, que `agora/server/bundle-lambdas.mjs`: el runtime gestionado
 * de Lambda (`nodejs24.x`) no garantiza traer el SDK v3 modular
 * preinstalado, así que `contacto.ts` (que importa `@aws-sdk/client-ses`)
 * fallaría en el arranque con un 500 genérico si se empaquetara "simple"
 * como hace `ssr` con `@codegenie/serverless-express` (esa sí se copia a
 * mano porque es una sola dependencia liviana, sin árbol propio real).
 */
const OUT_DIR = 'dist-server-bundle';
mkdirSync(OUT_DIR, { recursive: true });

const entradas = [
  { entrada: 'dist-server/api/handlers/contacto.js', salida: `${OUT_DIR}/contacto.js` },
];

for (const { entrada, salida } of entradas) {
  await build({
    entryPoints: [entrada],
    outfile: salida,
    bundle: true,
    platform: 'node',
    target: 'node24',
    format: 'cjs',
    logLevel: 'warning',
  });
  console.log(`esbuild: ${entrada} -> ${salida}`);
}
