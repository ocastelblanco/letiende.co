import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

export const app = express();
const angularApp = new AngularNodeAppEngine();

const DOMINIO = 'https://letiende.co';
// Igual que AnalyticsService (core/analytics/) — el mismo artefacto sirve a
// staging y a producción (ver docs/MEMORY.md, ADR-015), así que solo el host
// exacto de producción distingue uno de otro en tiempo de petición.
const HOST_PRODUCCION = 'letiende.co';

// Rutas propias del contenedor, en sincronía manual con app.routes.ts
// (tech-specs.md §4.2) — son solo cuatro, no vale la pena un descubrimiento
// automático todavía.
const RUTAS_PROPIAS = ['/', '/nosotros', '/contacto', '/preguntas-frecuentes'];

/**
 * ADR-002 (docs/MEMORY.md): staging necesita `Disallow: /`, para no competir
 * contra producción por las mismas palabras. `req.hostname` es lo único que
 * distingue un stage del otro, porque los dos despliegan el mismo artefacto.
 */
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  if (req.hostname !== HOST_PRODUCCION) {
    res.send('User-agent: *\nDisallow: /\n');
    return;
  }
  res.send(`User-agent: *\nAllow: /\n\nSitemap: ${DOMINIO}/sitemap.xml\n`);
});

/**
 * Solo las rutas propias del contenedor, no el índice de los tres que
 * tech-specs.md §4.5 describe como destino final: verificado en vivo
 * (curl contra agora.letiende.co/sitemap.xml) que Ágora todavía emite el
 * suyo bajo su propio subdominio, no bajo /cartelera (llega con T-11), y
 * Babel no tiene sitemap propio todavía (T-12). Agregarlos hoy enviaría a
 * los buscadores direcciones equivocadas o rotas — peor que no tener
 * índice. Se convierte en el índice real cuando T-11/T-12 existan (ver
 * docs/MEMORY.md, ADR-018).
 */
app.get('/sitemap.xml', (_req, res) => {
  const urls = RUTAS_PROPIAS.map((ruta) => `  <url><loc>${DOMINIO}${ruta}</loc></url>`).join('\n');
  res.type('application/xml');
  res.send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
