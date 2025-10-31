/**
 * API Lambda para Le Tiende
 * Actualizado a Node.js 22.x con ES Modules
 * @module api-letiende
 */

import { apiDiscogs, apiCoverDiscogs } from './libs/discogs.mjs';
import { apiGoogleBooks } from './libs/googlebooks.mjs';
import { leePOST, formateaEmail, validaReCAPTCHA, leeJSON, guardarContenidoS3 } from './libs/funciones.mjs';
import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";

const REGION = 'us-east-1';

/**
 * Handler principal de la función Lambda
 * @param {Object} event - Evento de API Gateway
 * @param {Object} context - Contexto de ejecución Lambda
 * @param {Function} callback - Callback para respuesta
 */
export const handler = async (event, context, callback) => {
  /**
   * Función de salida de datos, común para todos los endpoints
   * @param {*} body - Cuerpo de la respuesta
   * @param {number} statusCode - Código HTTP de estado
   */
  const salida = (body = 'Hola perola!', statusCode = 200) => {
    callback(null, {
      statusCode,
      body: JSON.stringify(body),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      }
    });
  };

  // Manejo de errores global
  try {
    // Captura del {id} que determina el uso de la API
    const id = event.pathParameters?.id ?? 'discogs';

    switch (id) {
      case 'nombre': {
        // Ejemplo: https://api.letiende.co/nombre?nombre=Oliver
        const dataNombre = await procesaNombre(event);
        salida(dataNombre);
        break;
      }

      case 'discogs': {
        const dataDis = await apiDiscogs(event);
        salida(dataDis);
        break;
      }

      case 'coverDiscogs': {
        const dataImg = await apiCoverDiscogs(event);
        salida(dataImg);
        break;
      }

      case 'libros': {
        const dataLib = await apiGoogleBooks(event);
        salida(dataLib);
        break;
      }

      case 'mensaje': {
        const mensaje = leePOST(event);
        if (mensaje.ok) {
          const comando = new SendEmailCommand(formateaEmail(mensaje.data));
          const sesClient = new SESClient({ region: REGION });
          try {
            const envio = await sesClient.send(comando);
            console.log('Éxito enviando email:', envio);
            salida(envio);
          } catch (e) {
            console.error('Error enviando email:', e);
            salida({ error: e.message }, 500);
          }
        } else {
          salida(mensaje, 400);
        }
        break;
      }

      case 'recaptcha': {
        const payload = leePOST(event);
        if (payload.ok) {
          const respuesta = await validaReCAPTCHA(payload.data);
          salida(respuesta);
        } else {
          salida(payload, 400);
        }
        break;
      }
      case 'actualizarContenido': {
        // Recibe contenido desde Google Apps Script y lo almacena en S3
        const payload = leeJSON(event);
        if (payload.ok) {
          try {
            const resultado = await guardarContenidoS3(payload.data);
            if (resultado.success) {
              salida({
                success: true,
                message: resultado.message,
                seccion: payload.data.seccion,
                url: resultado.url,
                timestamp: resultado.timestamp
              }, 200);
            } else {
              salida({
                success: false,
                message: resultado.message,
                error: resultado.error
              }, 400);
            }
          } catch (error) {
            console.error('Error en actualizarContenido:', error);
            salida({
              success: false,
              message: 'Error procesando contenido',
              error: error.message
            }, 500);
          }
        } else {
          salida({
            success: false,
            message: payload.data
          }, 400);
        }
        break;
      }

      default:
        salida();
    }
  } catch (error) {
    console.error('Error en handler:', error);
    salida({ error: error.message }, 500);
  }
};

/**
 * Función de ejemplo para procesar nombres
 * @param {Object} event - Evento de API Gateway
 * @returns {Promise<string>} - Mensaje con el nombre
 */
const procesaNombre = (event) => {
  return new Promise((resolve) => {
    const nombre = event.queryStringParameters?.nombre ?? null;
    if (nombre) {
      resolve(`Me pediste este nombre: ${nombre}`);
    } else {
      resolve('No me diste ningún nombre');
    }
  });
};