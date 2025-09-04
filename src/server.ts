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

// Manejo robusto de secrets
let localSecrets: any = {};
try {
  const secretsModule = await import('./secrets');
  localSecrets = secretsModule.localSecrets || {};
} catch (error) {
  console.log('[SERVER.TS] No secrets file found, using env variables only');
  localSecrets = {};
}

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('[SERVER.TS] UNCAUGHT EXCEPTION:', error);
  console.error('[SERVER.TS] Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[SERVER.TS] UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const browserDistFolder = join(import.meta.dirname, '../browser');
console.log(`[SERVER.TS] Browser dist folder: ${browserDistFolder}`);
console.log(`[SERVER.TS] Current dirname: ${import.meta.dirname}`);
console.log(`[SERVER.TS] Environment variables:`, {
  NODE_ENV: process.env['NODE_ENV'],
  APP_BASE_HREF: process.env['APP_BASE_HREF'],
  PROVIDER_STAGE: process.env['PROVIDER_STAGE']
});

const app = express();

// Crear AngularNodeAppEngine
let angularApp: AngularNodeAppEngine;
try {
  angularApp = new AngularNodeAppEngine();
  console.log('[SERVER.TS] AngularNodeAppEngine created successfully');
} catch (error) {
  console.error('[SERVER.TS] Error creating AngularNodeAppEngine:', error);
  throw error;
}

/**
 * API Endpoints
 */
app.use('/api', express.json({ limit: '10mb' }));
app.use('/api', express.urlencoded({ extended: true, limit: '10mb' }));

// Configura Cloudinary
const cld_cld_name = process.env['CLOUDINARY_CLOUD_NAME'] || localSecrets?.CLOUDINARY_CLOUD_NAME;
const cld_api_key = process.env['CLOUDINARY_API_KEY'] || localSecrets?.CLOUDINARY_API_KEY;
const cld_api_secret = process.env['CLOUDINARY_API_SECRET'] || localSecrets?.CLOUDINARY_API_SECRET;

if (cld_cld_name && cld_api_key && cld_api_secret) {
  try {
    cloudinary.v2.config({
      cloud_name: cld_cld_name,
      api_key: cld_api_key,
      api_secret: cld_api_secret,
      secure: true,
    });
    console.log('[SERVER.TS] Cloudinary SDK configurado.');
  } catch (error) {
    console.error('[SERVER.TS] Error configurando Cloudinary:', error);
  }

  app.post('/api/cloudinary/signature', (req: Request, res: ExpressResponse) => {
    try {
      const paramsToSign = req.body.params_to_sign;
      if (!paramsToSign) {
        res.status(400).json({ error: 'Faltan parámetros para firmar (params_to_sign).' });
        return;
      }
      const signature = cloudinary.v2.utils.api_sign_request(paramsToSign, cld_api_secret);
      res.json({ signature });
    } catch (error) {
      console.error('[SERVER.TS] Error generando firma de Cloudinary:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  app.post('/api/cloudinary/details', (req: Request, res: ExpressResponse) => {
    try {
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
    } catch (error) {
      console.error('[SERVER.TS] Error en endpoint cloudinary/details:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
} else {
  console.warn('[SERVER.TS] Faltan variables de entorno de Cloudinary. Los endpoints no estarán disponibles.');
}

/**
 * Serve static files
 */
try {
  app.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: false,
      redirect: false,
    }),
  );
  console.log('[SERVER.TS] Static files middleware configured');
} catch (error) {
  console.error('[SERVER.TS] Error configuring static files:', error);
}

/**
 * Función personalizada para escribir la respuesta
 */
async function safeWriteResponse(response: Response, res: ExpressResponse): Promise<void> {
  try {
    console.log('[SERVER.TS] === INICIANDO ESCRITURA DE RESPUESTA ===');
    console.log('[SERVER.TS] Response details:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers ? Object.fromEntries(response.headers.entries()) : null,
      bodyUsed: response.bodyUsed,
      redirected: response.redirected,
      type: response.type,
      url: response.url
    });

    // Verificar si ya se enviaron headers
    if (res.headersSent) {
      console.error('[SERVER.TS] Headers already sent, cannot write response');
      return;
    }

    // Configurar status
    res.status(response.status);
    console.log('[SERVER.TS] Status set to:', response.status);

    // Configurar headers
    if (response.headers) {
      for (const [key, value] of response.headers.entries()) {
        try {
          res.setHeader(key, value);
          console.log(`[SERVER.TS] Header set: ${key} = ${value}`);
        } catch (headerError) {
          console.error(`[SERVER.TS] Error setting header ${key}:`, headerError);
        }
      }
    }

    // Leer y enviar el body
    if (response.body) {
      console.log('[SERVER.TS] Reading response body...');

      // Método alternativo: usar arrayBuffer en lugar de text
      try {
        const buffer = await response.arrayBuffer();
        console.log(`[SERVER.TS] Body read successfully, size: ${buffer.byteLength} bytes`);

        const uint8Array = new Uint8Array(buffer);
        res.send(Buffer.from(uint8Array));
        console.log('[SERVER.TS] Response sent successfully');

      } catch (bodyError) {
        console.error('[SERVER.TS] Error reading response body:', bodyError);
        throw bodyError;
      }
    } else {
      console.log('[SERVER.TS] No body to send');
      res.end();
    }

    console.log('[SERVER.TS] === ESCRITURA DE RESPUESTA COMPLETADA ===');

  } catch (error) {
    console.error('[SERVER.TS] Error in safeWriteResponse:', error);
    throw error;
  }
}

/**
 * Handle Angular SSR
 */
app.use(async (req, res, next) => {
  const appBaseHref = process.env['APP_BASE_HREF'] || '/';
  console.log(`[SERVER.TS] === NUEVA REQUEST ===`);
  console.log(`[SERVER.TS] Request Original URL: ${req.originalUrl}`);
  console.log(`[SERVER.TS] Request Path: ${req.path}`);
  console.log(`[SERVER.TS] Request BaseURL: ${req.baseUrl}`);
  console.log(`[SERVER.TS] Request Method: ${req.method}`);
  console.log(`[SERVER.TS] APP_BASE_HREF from env: ${appBaseHref}`);

  try {
    console.log('[SERVER.TS] Calling angularApp.handle()');
    const originalResponse = await angularApp.handle(req);

    console.log(`[SERVER.TS] Angular response received:`, {
      hasResponse: !!originalResponse,
      status: originalResponse?.status,
      statusText: originalResponse?.statusText,
      url: originalResponse?.url,
      headers: originalResponse?.headers ? Object.fromEntries(originalResponse.headers.entries()) : null
    });

    if (!originalResponse) {
      console.log('[SERVER.TS] No response from Angular, passing to next middleware');
      return next();
    }

    let responseToSend: Response = originalResponse;

    // Manejo de redirects
    if ([301, 302, 307, 308].includes(originalResponse.status)) {
      let location: string | null = originalResponse.headers.get('Location');
      console.log(`[SERVER.TS] Handling redirect: Status=${originalResponse.status}, Location=${location}`);

      if (location && location.startsWith('/') && appBaseHref !== '/') {
        if (!location.startsWith(appBaseHref)) {
          const newLocation: string = posixPath.join(appBaseHref, location);
          console.log(`[SERVER.TS] Adjusting Location from "${location}" to "${newLocation}"`);
          originalResponse.headers.set('Location', newLocation);
        }
      }
    }
    // Para respuestas HTML, NO modificar el body si ya tiene el base href correcto
    else if (originalResponse.body && originalResponse.headers.get('content-type')?.includes('text/html')) {
      console.log(`[SERVER.TS] HTML response detected, checking base href`);

      // Solo modificar si realmente es necesario
      const baseHrefFromEnv = process.env['APP_BASE_HREF'] || '/';
      if (baseHrefFromEnv !== '/') {
        try {
          // Leer el HTML para verificar el base href
          const htmlContent = await originalResponse.text();
          const baseHrefRegex = /<base\s+href="([^"]*)"\s*\/?>/i;
          const match = htmlContent.match(baseHrefRegex);
          const currentBaseHrefInHtml = match ? match[1] : null;

          console.log(`[SERVER.TS] Current base href in HTML: ${currentBaseHrefInHtml}`);
          console.log(`[SERVER.TS] Expected base href: ${baseHrefFromEnv}`);

          if (currentBaseHrefInHtml === baseHrefFromEnv) {
            console.log(`[SERVER.TS] Base href is already correct, no modification needed`);
            // Recrear la Response con el HTML original
            responseToSend = new Response(htmlContent, {
              status: originalResponse.status,
              statusText: originalResponse.statusText,
              headers: originalResponse.headers
            });
          } else {
            // Solo modificar si es necesario
            let modifiedHtmlContent = htmlContent;
            if (match) {
              modifiedHtmlContent = htmlContent.replace(baseHrefRegex, `<base href="${baseHrefFromEnv}">`);
              console.log(`[SERVER.TS] Replaced base href from "${currentBaseHrefInHtml}" to "${baseHrefFromEnv}"`);
            } else {
              modifiedHtmlContent = htmlContent.replace(/(<head[^>]*>)/i, `$1\n  <base href="${baseHrefFromEnv}">`);
              console.log(`[SERVER.TS] Added base href "${baseHrefFromEnv}" to HTML`);
            }

            responseToSend = new Response(modifiedHtmlContent, {
              status: originalResponse.status,
              statusText: originalResponse.statusText,
              headers: originalResponse.headers
            });
          }
        } catch (htmlError) {
          console.error('[SERVER.TS] Error processing HTML content:', htmlError);
          responseToSend = originalResponse;
        }
      }
    }

    console.log(`[SERVER.TS] About to send response with status: ${responseToSend.status}`);

    // Usar nuestra función personalizada en lugar de writeResponseToNodeResponse
    await safeWriteResponse(responseToSend, res);

  } catch (error) {
    console.error('!!! ERROR DURING SSR HANDLING !!!');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Non-Error object thrown:', error);
      console.error('Stringified error:', JSON.stringify(error, null, 2));
    }

    console.error('Request details:', {
      originalUrl: req.originalUrl,
      method: req.method,
      path: req.path,
      baseUrl: req.baseUrl
    });

    const errorToPass = error instanceof Error ? error : new Error(`SSR Error: ${JSON.stringify(error)}`);
    next(errorToPass);
  }
});

// Error handler middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[SERVER.TS] === ERROR HANDLER MIDDLEWARE ===');
  console.error('Error details:', {
    message: err?.message || 'Unknown error',
    stack: err?.stack || 'No stack trace',
    name: err?.name || 'Unknown',
    type: typeof err
  });

  console.error('Request details:', {
    originalUrl: req.originalUrl,
    method: req.method,
    path: req.path,
    baseUrl: req.baseUrl
  });

  if (!res.headersSent) {
    res.status(500).json({
      message: 'Internal server error',
      error: process.env['NODE_ENV'] === 'development' ? (err?.message || 'Unknown error') : 'Something went wrong',
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  }
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      console.error('[SERVER.TS] Error starting server:', error);
      throw error;
    }
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
export const handler = serverlessExpress({ app });