// Consulta la API de Google Books
// Actualizado a ES Modules para Node.js 22.x
// @see https://developers.google.com/books/docs/v1/using?hl=es-419

import https from 'https';

const rutaAPI = 'https://www.googleapis.com/books/v1/volumes?fields=items(volumeInfo)&q=';
const API_KEY = process.env.google_API_KEY;

/**
 * Consulta la API de Google Books por ISBN, autor o título
 * @param {Object} event - Evento de API Gateway con queryStringParameters
 * @returns {Promise<Object|null>} - Datos del libro o null
 */
export const apiGoogleBooks = (event) => {
  const barcode = event.queryStringParameters?.barcode ?? null;
  const autor = event.queryStringParameters?.autor ?? null;
  const titulo = event.queryStringParameters?.titulo ?? null;

  // Construir query según parámetros disponibles
  const query = (barcode ? `isbn:${barcode}` : '') +
                (autor ? `inauthor:${autor}` : '') +
                (titulo ? `intitle:${titulo}` : '');

  return new Promise((resolve, reject) => {
    if (query === '') {
      resolve(null);
      return;
    }

    const req = `${rutaAPI}${query}&key=${API_KEY}`;

    https.get(req, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];

      // Validaciones de respuesta
      if (statusCode !== 200) {
        const error = new Error(`Request Failed. Status Code: ${statusCode}`);
        console.error(error.message);
        res.resume();
        reject(error);
        return;
      }

      if (!/^application\/json/.test(contentType)) {
        const error = new Error(`Invalid content-type. Expected application/json but received ${contentType}`);
        console.error(error.message);
        res.resume();
        reject(error);
        return;
      }

      res.setEncoding('utf8');
      let rawData = '';

      res.on('data', (chunk) => {
        rawData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData);
        } catch (e) {
          console.error('Error parsing JSON:', e.message);
          reject(e);
        }
      });

    }).on('error', (e) => {
      console.error(`Got error: ${e.message}`);
      reject(e);
    });
  });
};
