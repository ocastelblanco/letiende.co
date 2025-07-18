import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { Request, Response as ExpressResponse } from 'express';
import cloudinary from 'cloudinary';
import { join, posix as posixPath } from 'node:path';
import serverlessExpress from '@codegenie/serverless-express';
import { localSecrets } from './secrets';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
// La inyección de providers específicos del servidor se realiza en `app.config.server.ts`.
const angularApp = new AngularNodeAppEngine();

/**
 * API Endpoints. Deben definirse ANTES del handler de Angular.
 */

// Middleware para parsear JSON en los bodies de las peticiones API
app.use('/api', express.json({ limit: '10mb' }));
app.use('/api', express.urlencoded({ extended: true, limit: '10mb' }));

// Configura el SDK de Cloudinary en el servidor usando las variables de entorno seguras.
const cld_cld_name = process.env['CLOUDINARY_CLOUD_NAME'] || localSecrets.CLOUDINARY_CLOUD_NAME;
const cld_api_key = process.env['CLOUDINARY_API_KEY'] || localSecrets.CLOUDINARY_API_KEY;
const cld_api_secret = process.env['CLOUDINARY_API_SECRET'] || localSecrets.CLOUDINARY_API_SECRET;

if (cld_cld_name && cld_api_key && cld_api_secret) {
  cloudinary.v2.config({
    cloud_name: cld_cld_name,
    api_key: cld_api_key,
    api_secret: cld_api_secret,
    secure: true,
  });
  console.log('[SERVER.TS] Cloudinary SDK configurado.');

  // Endpoint para generar una firma segura para las subidas desde el cliente.
  app.post('/api/cloudinary/signature', (req: Request, res: ExpressResponse) => {
    const paramsToSign = req.body.params_to_sign;
    if (!paramsToSign) {
      res.status(400).json({ error: 'Faltan parámetros para firmar (params_to_sign).' });
      return;
    }
    const signature = cloudinary.v2.utils.api_sign_request(paramsToSign, cld_api_secret);
    res.json({ signature });
  });
  app.post('/api/cloudinary/details', (req: Request, res: ExpressResponse) => {
    const publicId = req.body.public_id;
    if (!publicId) {
      res.status(400).json({ error: 'Falta el parámetro public_id.' });
      return;
    }
    console.log('[SERVER.TS] Obteniendo detalles para public_id:', publicId);
    cloudinary.v2.api.resource(publicId)
      .then(result => {
        console.log('[SERVER.TS] Detalles obtenidos exitosamente');
        res.json({ result });
      })
      .catch(err => {
        console.error('[SERVER.TS] Error al obtener detalles del recurso de Cloudinary:', err);
        res.status(500).json({
          error: 'Error al obtener detalles del recurso',
          details: err.message
        });
      });
  });
} else {
  console.warn('[SERVER.TS] Faltan variables de entorno de Cloudinary. Los endpoints no estarán disponibles.');
}

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
    .catch(err => {
      console.error('!!! ERROR DURING SSR HANDLING !!!');
      console.error(err);
      next(err);
    });
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
