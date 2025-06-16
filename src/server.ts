import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join, posix as posixPath } from 'node:path';
import serverlessExpress from '@codegenie/serverless-express';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

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
  const appBaseHref = process.env['APP_BASE_HREF'] || '/';
  console.log(`[SERVER.TS] Request Original URL: ${req.originalUrl}, Path: ${req.path}, BaseURL: ${req.baseUrl}`);
  console.log(`[SERVER.TS] APP_BASE_HREF from env: ${appBaseHref}`);
  angularApp
    .handle(req)
    .then(async (originalResponse: Response | null) => { // Hacemos el callback asíncrono
      if (!originalResponse) {
        // Si no hay respuesta de Angular, pasamos al siguiente middleware de Express (ej. 404)
        return next();
      }

      // Esta será la respuesta que finalmente enviaremos.
      // Comienza como la respuesta original, pero podría ser reemplazada si el cuerpo se lee/modifica.
      let responseToSend: Response = originalResponse;

      if (originalResponse.status === 301 || originalResponse.status === 302 || originalResponse.status === 307 || originalResponse.status === 308) {
        let location: string | null = originalResponse.headers.get('Location');
        console.log(`[SERVER.TS] Original Angular SSR Redirect: Status=${originalResponse.status}, Location=${location}, APP_BASE_HREF=${appBaseHref}`);
        if (location && location.startsWith('/') && appBaseHref !== '/') {
          if (!location.startsWith(appBaseHref)) {
            const newLocation: string = posixPath.join(appBaseHref, location);
            console.log(`[SERVER.TS] Adjusting Redirect Location from "${location}" to: "${newLocation}"`);
            // Las cabeceras SÍ se pueden modificar en el objeto Response original.
            originalResponse.headers.set('Location', newLocation);
          }
        }
        // responseToSend sigue siendo originalResponse, que ahora tiene la cabecera Location modificada.
      } else if (originalResponse.body && originalResponse.headers.get('content-type')?.includes('text/html')) {
        // Asegurar que la etiqueta <base href> sea correcta en el HTML renderizado
        const baseHrefFromEnv = process.env['APP_BASE_HREF'] || '/';

        if (baseHrefFromEnv !== '/') {
          // Leer el cuerpo consume el stream. Debemos crear una nueva Response después.
          const htmlContent: string = await originalResponse.text();
          let modifiedHtmlContent: string = htmlContent; // Asumimos que no hay modificación inicialmente

          const baseHrefRegex: RegExp = /<base\s+href="([^"]*)"\s*\/?>/i;
          const match: RegExpMatchArray | null = htmlContent.match(baseHrefRegex);
          const currentBaseHrefInHtml: string | null = match ? match[1] : null;

          if (currentBaseHrefInHtml !== baseHrefFromEnv) {
            if (match) {
              modifiedHtmlContent = htmlContent.replace(baseHrefRegex, `<base href="${baseHrefFromEnv}">`);
              console.log(`[SERVER.TS] Replaced <base href> in HTML from "${currentBaseHrefInHtml}" to "${baseHrefFromEnv}"`);
            } else {
              modifiedHtmlContent = htmlContent.replace(/(<head[^>]*>)/i, `$1\n  <base href="${baseHrefFromEnv}">`);
              console.log(`[SERVER.TS] Added <base href="${baseHrefFromEnv}"> to HTML`);
            }
          }
          // Creamos una nueva Response porque el stream del cuerpo de originalResponse se consumió con .text()
          responseToSend = new Response(modifiedHtmlContent, {
            status: originalResponse.status,
            statusText: originalResponse.statusText,
            headers: originalResponse.headers // Las cabeceras se clonan/copian
          });
        }
      }
      return writeResponseToNodeResponse(responseToSend, res);
    })
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
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

/**
 * Handler for AWS Lambda using @codegenie/serverless-express.
 * This is the entry point for your Lambda function.
 */
export const handler = serverlessExpress({ app });
