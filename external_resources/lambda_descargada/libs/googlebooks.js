// Consulta la API de Google Books, siguiendo las instrucciones de https://developers.google.com/books/docs/v1/using?hl=es-419
const https = require('https');
const rutaAPI = 'https://www.googleapis.com/books/v1/volumes?fields=items(volumeInfo)&q=';
const API_KEY = process.env.google_API_KEY;
class GoogleBooksAPI {
  constructor(id) {
   this.id = id;
  }
};
exports.apiGoogleBooks = (event) => {
  const barcode = event.queryStringParameters && event.queryStringParameters.barcode ? event.queryStringParameters.barcode : null;
  const autor = event.queryStringParameters && event.queryStringParameters.autor ? event.queryStringParameters.autor : null;
  const titulo = event.queryStringParameters && event.queryStringParameters.titulo ? event.queryStringParameters.titulo : null;
  const query = (barcode ? 'isbn:' + barcode : '') + (autor ? 'inauthor:' + autor : '') + (titulo ? 'intitle:' + titulo : '');
  const salida = new Promise((resolve, reject) => {
    if (query != '') {
      const req = rutaAPI + query + '&key=' + API_KEY;
      https.get(req, res => {
        const { statusCode } = res;
        const contentType = res.headers['content-type'];
        let error;
        if (statusCode !== 200) {
          error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
          error = new Error('Invalid content-type.\n' + `Expected application/json but received ${contentType}`);
        }
        if (error) {
          console.error(error.message);
          res.resume();
          return;
        }
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(rawData);
            resolve(parsedData);
          } catch (e) {
            console.error(e.message);
          }
        });
      }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);
      });
    } else {
      resolve(null);
    }
  });
  return salida;
}