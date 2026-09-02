#!/usr/bin/env node
// Escaneo de secretos sobre los archivos en stage, ejecutado por el gancho de
// pre-commit (.husky/pre-commit). Sin dependencias externas a propósito:
// GitGuardian cubre esto a nivel de PR en Ágora y Babel vía su GitHub App,
// pero eso es una integración de la cuenta de GitHub, no de este repositorio
// — instalarla aquí es una decisión del humano, no de un commit de código.
// Esto es la red local mientras tanto (CLAUDE.md §5, tabla de prohibiciones).

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PATRONES = [
  { nombre: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/g },
  { nombre: 'Llave privada', regex: /-----BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY-----/g },
  { nombre: 'Token estilo OpenAI/Stripe', regex: /\bsk-[a-zA-Z0-9]{20,}\b/g },
  { nombre: 'GitHub Personal Access Token', regex: /\bghp_[a-zA-Z0-9]{36}\b/g },
  { nombre: 'Token de Slack', regex: /\bxox[baprs]-[a-zA-Z0-9-]{10,}\b/g },
  { nombre: 'Clave de API de Google', regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
];

const archivos = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

let hallazgos = 0;

for (const archivo of archivos) {
  let contenido;
  try {
    contenido = readFileSync(archivo, 'utf8');
  } catch {
    continue; // binario o eliminado entre el stage y este momento
  }

  for (const { nombre, regex } of PATRONES) {
    const coincidencias = contenido.match(regex);
    if (coincidencias) {
      hallazgos += coincidencias.length;
      console.error(`  ✖ ${archivo}: posible ${nombre} (${coincidencias.length})`);
    }
  }
}

if (hallazgos > 0) {
  console.error(`\nEscaneo de secretos: ${hallazgos} hallazgo(s). Commit bloqueado.`);
  console.error('Si es un falso positivo, documenta por qué antes de forzar el commit.');
  process.exit(1);
}

console.log('Escaneo de secretos: sin hallazgos.');
