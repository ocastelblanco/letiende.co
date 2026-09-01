import { apiDiscogs, apiCoverDiscogs } from './libs/discogs.js';
import { apiGoogleBooks } from './libs/googlebooks.js';
import { leePOST, formateaEmail, validaReCAPTCHA } from './libs/funciones.js';
import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";

const REGION = 'us-east-1';

export const handler = async (event, context, callback) => {
  // Función de salida de datos, común para todos.
  const salida = (body = 'Hola perola!', statusCode = 200) => {
    callback(
      null, {
        "statusCode": statusCode,
        "body": JSON.stringify(body),
        "headers": { "Access-Control-Allow-Origin": "*" }
      }
    );
  };
  // Captura del {id} que determina el uso de la API
  const id = event.pathParameters ? event.pathParameters.id : 'discogs';
  switch (id) {
    case 'nombre': // Se pide retornar el nombre que se pasó como Query
      // Con un llamado del tipo https://api.letiende.co/nombre?nombre=Oliver
      const dataNombre = await procesaNombre(event);
      salida(dataNombre);
      break;
    case 'discogs':
      const dataDis = await apiDiscogs(event);
      salida(dataDis);
      break;
    case 'coverDiscogs':
      const dataImg = await apiCoverDiscogs(event);
      salida(dataImg);
      break;
    case 'libros':
      const dataLib = await apiGoogleBooks(event);
      salida(dataLib);
      break;
    case 'mensaje':
      const mensaje = leePOST(event);
      if (mensaje.ok) {
        const comando = new SendEmailCommand(formateaEmail(mensaje.data));
        const sesClient = new SESClient({region: REGION});
        try {
          const envio = await sesClient.send(comando);
          console.log('Éxito: ', envio);
          salida(envio);
        }
        catch (e) {
          console.log('Error ', e);
          salida(e);
        }
      }
      else {
        salida(mensaje);
      }
      break;
    case 'recaptcha':
      const payload = leePOST(event);
      if (payload.ok) {
        const respuesta = await validaReCAPTCHA(payload.data);
        salida(respuesta);
      }
      break;
    default:
      salida();
  }
};
// Funciones genéricas internas
const procesaNombre = (event) => {
  return new Promise((resolve, reject) => {
    const nombre = event.queryStringParameters && event.queryStringParameters.nombre ? event.queryStringParameters.nombre : null;
    if (nombre) {
      resolve('Me pediste este nombre: ' + nombre);
    }
    else {
      resolve('No me diste ningún nombre');
    }
  });
};