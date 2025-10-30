// Administra disconnect, la librería para acceder a Discogs
// Actualizado a ES Modules para Node.js 22.x usando createRequire para librería CommonJS
// @see https://github.com/bartve/disconnect

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Importar disconnect usando CommonJS require (la librería solo soporta CommonJS)
const Discogs = require('disconnect').Client;

const consulta = new Discogs({ userToken: process.env.discogs_token });
const db = consulta.database();

/**
 * Busca un álbum en Discogs por código de barras o por álbum/artista
 * @param {Object} event - Evento de API Gateway con queryStringParameters
 * @returns {Promise<Object|null>} - Datos del álbum o null
 */
export const apiDiscogs = (event) => {
  const barcode = event.queryStringParameters?.barcode ?? null;
  const album = event.queryStringParameters?.album ?? null;
  const artista = event.queryStringParameters?.artista ?? null;
  const query = album && artista ? { release_title: album, artist: artista } : null;

  return new Promise((resolve, reject) => {
    if (barcode) {
      db.search(barcode, 'barcode', (err, data) => {
        if (err) {
          console.error('Error buscando por barcode en Discogs:', err);
          reject(err);
          return;
        }
        resolve(data.results?.[0] ?? null);
      });
    } else if (query) {
      db.search(query, (err, data) => {
        if (err) {
          console.error('Error buscando por query en Discogs:', err);
          reject(err);
          return;
        }
        // Buscar el primer resultado que sea vinilo
        const vinylResult = data.results?.find(res => res.format?.indexOf('Vinyl') > -1);
        resolve(vinylResult ?? null);
      });
    } else {
      resolve(null);
    }
  });
};

/**
 * Obtiene la imagen de portada de un álbum desde Discogs
 * @param {Object} event - Evento de API Gateway con queryStringParameters
 * @returns {Promise<Object|null>} - Datos de la imagen o null
 */
export const apiCoverDiscogs = (event) => {
  const coverURL = event.queryStringParameters?.cover ?? null;

  return new Promise((resolve, reject) => {
    if (coverURL) {
      db.getImage(coverURL, (err, data, rateLimit) => {
        if (err) {
          console.error('Error obteniendo cover de Discogs:', err);
          reject(err);
          return;
        }
        resolve({
          err: err,
          data: data,
          rateLimit: rateLimit
        });
      });
    } else {
      resolve(null);
    }
  });
};
