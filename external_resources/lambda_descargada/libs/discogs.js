// Administra disconnect, la librería para acceder a Discogs. Este JS es un CommonJS
const Discogs = require('disconnect').Client;

const consulta = new Discogs({userToken: process.env.discogs_token});
const db = consulta.database();

class DiscogsAPI {
  constructor(id) {
    this.id = id;
  }
}
exports.apiDiscogs = (event) => {
  const barcode = event.queryStringParameters && event.queryStringParameters.barcode ? event.queryStringParameters.barcode : null;
  const album = event.queryStringParameters && event.queryStringParameters.album ? event.queryStringParameters.album : null;
  const artista = event.queryStringParameters && event.queryStringParameters.artista ? event.queryStringParameters.artista : null;
  const query = album && artista ? { release_title: album, artist: artista } : null;
  const salida = new Promise((resolve, reject) => {
    if (barcode) {
      db.search(barcode, 'barcode', (err, data) => resolve(data.results[0]));
    } else if (query) {
      db.search(query, (err, data) => resolve(data.results.find(res => res.format.indexOf('Vinyl') > -1)));
    } else {
      resolve(null);
    }
  });
  return salida;
};
exports.apiCoverDiscogs = (event) => {
  const coverURL = event.queryStringParameters && event.queryStringParameters.cover ? event.queryStringParameters.cover : null;
  const salida = new Promise((resolve, reject) => {
    if (coverURL) {
      db.getImage(coverURL, (err, data, rateLimit) => resolve({err: err, data: data, rateLimit: rateLimit}));
    } else {
      resolve(null);
    }
  });
  return salida;
};