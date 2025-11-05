// Funciones genéricas, que no requieren ni librerías externas ni API externas
// Actualizado a ES Modules para Node.js 22.x

import https from 'https';

/**
 * Lee y valida el body de una petición POST
 * @param {Object} event - Evento de API Gateway
 * @returns {Object} - {data: Object, ok: boolean}
 */
export const leePOST = (event) => {
  // API Gateway puede transformar headers a minúsculas, intentar ambos casos
  const origen = event.headers.origin || event.headers.Origin;
  const userAgent = event.headers['user-agent'] || event.headers['User-Agent'] || '';

  const origenesPermitidos = [
    'http://localhost:4200', // Desarrollo local
    'https://script.google.com', // Google Apps Script
    'https://letiende.co',
    'https://www.letiende.co',
    'https://olivercastelblanco.com',
    'https://www.olivercastelblanco.com',
    'https://ocastelblanco.com',
    'https://www.ocastelblanco.com',
    'https://bar23.co',
    'https://www.bar23.co',
  ];

  // Validar si el origen está en la lista permitida
  const origenValido = origen && origenesPermitidos.includes(origen);

  // Validar si viene de Google Apps Script por User-Agent
  const esGoogleAppsScript = userAgent.includes('Google-Apps-Script');

  if (origenValido || esGoogleAppsScript) {
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
    console.error('Origen no permitido:', { origen, userAgent });
    return {
      data: `El origen de la petición no está permitido. Origin: ${origen}, User-Agent: ${userAgent.substring(0, 50)}...`,
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
 * Lee y valida JSON desde el body de una petición
 * Soporta tanto application/json como multipart/form-data
 * @param {Object} event - Evento de API Gateway
 * @returns {Object} - {data: Object, ok: boolean}
 */
export const leeJSON = (event) => {
  // API Gateway puede transformar headers a minúsculas, intentar ambos casos
  const origen = event.headers.origin || event.headers.Origin;
  const userAgent = event.headers['user-agent'] || event.headers['User-Agent'] || '';

  const origenesPermitidos = [
    'http://localhost:4200', // Desarrollo local
    'https://script.google.com', // Google Apps Script
    'https://letiende.co',
    'https://www.letiende.co',
    'https://olivercastelblanco.com',
    'https://www.olivercastelblanco.com',
    'https://ocastelblanco.com',
    'https://www.ocastelblanco.com',
    'https://bar23.co',
    'https://www.bar23.co',
  ];

  // Validar si el origen está en la lista permitida
  const origenValido = origen && origenesPermitidos.includes(origen);

  // Validar si viene de Google Apps Script por User-Agent
  const esGoogleAppsScript = userAgent.includes('Google-Apps-Script');

  if (!origenValido && !esGoogleAppsScript) {
    console.error('Origen no permitido:', { origen, userAgent });
    return {
      data: `El origen de la petición no está permitido. Origin: ${origen}, User-Agent: ${userAgent.substring(0, 50)}...`,
      ok: false
    };
  }

  try {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];

    // Si es JSON directo
    if (contentType?.includes('application/json')) {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      return {
        data: body,
        ok: true
      };
    }

    // Si es multipart/form-data (legacy)
    if (contentType?.includes('multipart/form-data')) {
      const respuesta = deCodeBody(event);
      if (respuesta) {
        return {
          data: respuesta,
          ok: true
        };
      }
    }

    return {
      data: 'Content-Type no soportado. Use application/json',
      ok: false
    };
  } catch (error) {
    console.error('Error parseando JSON:', error);
    return {
      data: `Error parseando JSON: ${error.message}`,
      ok: false
    };
  }
};

/**
 * Guarda contenido JSON en S3
 * @param {Object} contenido - Objeto JSON con estructura {seccion, idiomas, metadata}
 * @returns {Promise<Object>} - {success: boolean, message: string, key?: string}
 */
export const guardarContenidoS3 = async (contenido) => {
  // Importación dinámica del cliente S3
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  const BUCKET_NAME = 'letiende-assets';
  const REGION = 'us-east-1';

  try {
    // Validaciones
    if (!contenido.seccion) {
      return {
        success: false,
        message: 'El campo "seccion" es requerido'
      };
    }

    if (!contenido.idiomas || typeof contenido.idiomas !== 'object') {
      return {
        success: false,
        message: 'El campo "idiomas" es requerido y debe ser un objeto'
      };
    }

    if (!contenido.idiomas.es) {
      return {
        success: false,
        message: 'Debe incluir al menos el idioma "es" (español)'
      };
    }

    // Validar secciones permitidas
    const seccionesValidas = [
      'inicio',
      'menu',
      'eventos',
      'auditorio',
      'libreria',
      'contacto',
      'nosotros'
    ];

    if (!seccionesValidas.includes(contenido.seccion)) {
      return {
        success: false,
        message: `Sección no válida. Secciones permitidas: ${seccionesValidas.join(', ')}`
      };
    }

    // Agregar timestamp si no existe
    if (!contenido.timestamp) {
      contenido.timestamp = new Date().toISOString();
    }

    // Preparar datos para S3
    const key = `data/${contenido.seccion}.json`;
    const body = JSON.stringify(contenido, null, 2);

    // Crear cliente S3
    const s3Client = new S3Client({ region: REGION });

    // Comando para subir archivo
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: 'application/json',
      CacheControl: 'max-age=300', // 5 minutos de caché
      Metadata: {
        'ultima-actualizacion': contenido.timestamp,
        'seccion': contenido.seccion,
        'version': contenido.metadata?.version || '1.0'
      }
    });

    // Ejecutar comando
    const response = await s3Client.send(command);

    console.log(`Contenido guardado exitosamente en S3: ${key}`);

    return {
      success: true,
      message: 'Contenido guardado exitosamente',
      key: key,
      url: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
      timestamp: contenido.timestamp,
      etag: response.ETag
    };

  } catch (error) {
    console.error('Error guardando en S3:', error);
    return {
      success: false,
      message: `Error guardando en S3: ${error.message}`,
      error: error.name
    };
  }
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
