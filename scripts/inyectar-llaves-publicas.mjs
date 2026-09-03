#!/usr/bin/env node
// Sustituye, sobre el `dist/` ya compilado, los marcadores de las llaves
// públicas de Google (googleAnalyticsId, googleMapsApiKey — ver
// src/environments/*.ts) por su valor real, leído de las variables de
// entorno GOOGLE_ANALYTICS_ID y GOOGLE_MAPS_API_KEY. Se ejecuta como
// `postbuild` (npm lo corre solo, después de `npm run build`, con cualquier
// `--configuration`), nunca antes: `ng build` ya prerenderiza /contacto con
// el marcador dentro del HTML estático, así que hace falta reemplazarlo
// también ahí, no solo en el bundle de JS — CLAUDE.md §5, A02, y
// docs/MEMORY.md ADR-017.
//
// Sin las variables de entorno (desarrollo local, o un build que no es de
// CI) no hace nada y no falla: el marcador se queda tal cual, inofensivo
// (GA4 además solo carga en el host letiende.co — AnalyticsService).

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist/letiende-co';
const EXTENSIONES = ['.js', '.mjs', '.html'];

const SUSTITUCIONES = [
  { marcador: '__GOOGLE_ANALYTICS_ID__', valor: process.env.GOOGLE_ANALYTICS_ID },
  { marcador: '__GOOGLE_MAPS_API_KEY__', valor: process.env.GOOGLE_MAPS_API_KEY },
].filter((s) => Boolean(s.valor));

if (SUSTITUCIONES.length === 0) {
  console.log(
    'inyectar-llaves-publicas: sin GOOGLE_ANALYTICS_ID/GOOGLE_MAPS_API_KEY en el entorno, no hay nada que sustituir.',
  );
  process.exit(0);
}

function* archivos(dir) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    const info = statSync(ruta);
    if (info.isDirectory()) {
      yield* archivos(ruta);
    } else if (EXTENSIONES.includes(nombre.slice(nombre.lastIndexOf('.')))) {
      yield ruta;
    }
  }
}

let archivosTocados = 0;

for (const ruta of archivos(DIST)) {
  const original = readFileSync(ruta, 'utf8');
  let actualizado = original;

  for (const { marcador, valor } of SUSTITUCIONES) {
    actualizado = actualizado.split(marcador).join(valor);
  }

  if (actualizado !== original) {
    writeFileSync(ruta, actualizado);
    archivosTocados += 1;
  }
}

console.log(`inyectar-llaves-publicas: ${archivosTocados} archivo(s) actualizado(s) en ${DIST}.`);
