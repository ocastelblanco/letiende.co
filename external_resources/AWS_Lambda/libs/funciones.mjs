// Funciones genéricas, que no requieren ni librerías externas ni API externas
// Actualizado a ES Modules para Node.js 22.x

import https from 'https';

/**
 * Lee y valida el body de una petición POST
 * @param {Object} event - Evento de API Gateway
 * @returns {Object} - {data: Object, ok: boolean}
 */
export const leePOST = (event) => {
  const origen = event.headers.origin;
  const origenesPermitidos = [
    'http://localhost:4200', // Desarrollo local
    'https://letiende.co',
    'https://www.letiende.co',
    'https://olivercastelblanco.com',
    'https://www.olivercastelblanco.com',
    'https://ocastelblanco.com',
    'https://www.ocastelblanco.com',
    'https://bar23.co',
    'https://www.bar23.co',
  ];

  if (origen && origenesPermitidos.includes(origen)) {
    const respuesta = deCodeBody(event);
    if (respuesta) {
      return {
        data: respuesta,
        ok: true
      };
    } else {
      return {
        data: 'No se pudo obtener el body del mensaje',
        ok: false
      };
    }
  } else {
    return {
      data: `El origen de la petición no está permitido: ${origen}`,
      ok: false
    };
  }
};

/**
 * Formatea los datos para enviar email con AWS SES
 * @param {Object} data - Objeto con destinatario, asunto, html, texto
 * @returns {Object} - Comando formateado para SES
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ses/command/SendEmailCommand/
 */
export const formateaEmail = (data) => {
  const { destinatario, asunto, html, texto } = data;
  return {
    Destination: {
      CcAddresses: [],
      ToAddresses: [destinatario],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: html,
        },
        Text: {
          Charset: "UTF-8",
          Data: texto,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: asunto,
      },
    },
    Source: 'info@ocastelblanco.com',
    ReplyToAddresses: [],
  };
};

/**
 * Valida un token de Google reCAPTCHA
 * @param {Object} data - Objeto con secret y response del reCAPTCHA
 * @returns {Promise<Object>} - Respuesta de Google reCAPTCHA API
 */
export const validaReCAPTCHA = (data) => {
  const url = 'https://www.google.com/recaptcha/api/siteverify?' + new URLSearchParams({
    secret: data.secret,
    response: data.response
  });

  const opciones = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, opciones, (res) => {
      let salida = '';
      res.on('data', (chunk) => salida += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(salida));
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on('error', (error) => reject(error));
    req.end();
  });
};

/**
 * Decodifica el body de una petición multipart/form-data
 * @param {Object} event - Evento de API Gateway
 * @returns {Object|null} - Objeto parseado o null si falla
 */
function deCodeBody(event) {
  try {
    const data = event.body.toString();
    const regexBoundary = /multipart\/form-data; boundary=(.*)/gm;
    const boundary = event.headers['content-type'].replace(regexBoundary, '$1');
    const variables = [];

    data.split(boundary).forEach((linea) => {
      if (linea !== '--') {
        const sr = /[\r\n]/g;
        const cd = /Content-Disposition:\sform-data;\sname=/g;
        const li = /--/g;
        const limpio = linea.replaceAll(sr, '').replaceAll(cd, '').replaceAll(li, '');
        const jr = /"(.*)"(.*)/g;
        const key = limpio.replace(jr, '$1');
        const value = limpio.replace(jr, '$2');
        const str = '"' + key + '":"' + value + '"';
        if (key && value) variables.push(str);
      }
    });

    const texto = '{' + variables.join(',') + '}';
    return JSON.parse(texto);
  } catch (error) {
    console.error('Error decodificando body:', error);
    return null;
  }
}
