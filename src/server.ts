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
    .then((response) => {
      if (response && (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308)) {
        let location = response.headers.get('Location');
        console.log(`[SERVER.TS] Original Angular SSR Redirect: Status=${response.status}, Location=${location}, APP_BASE_HREF=${appBaseHref}`);

        if (location && location.startsWith('/') && appBaseHref !== '/') {
          // Solo ajusta si la ubicación es una ruta absoluta (comienza con '/')
          // y APP_BASE_HREF no es la raíz ('/'),
          // y la ubicación no comienza ya con APP_BASE_HREF.
          if (!location.startsWith(appBaseHref)) {
            const newLocation = posixPath.join(appBaseHref, location);
            console.log(`[SERVER.TS] Adjusting Redirect Location from "${location}" to: "${newLocation}"`);
            response.headers.set('Location', newLocation);
          }
        }
      }
      return response ? writeResponseToNodeResponse(response, res) : next();
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
