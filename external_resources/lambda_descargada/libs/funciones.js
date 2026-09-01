// Funciones genéricas, que no requieren ni librerías externas ni API externas

const https = require('https');

exports.leePOST = (event) => {
  const origen = event.headers.origin;
  if (origen && (origen == 'http://localhost:4200' || autenticaOrigen(origen))) {
    const respuesta = deCodeBody(event);
    if (respuesta) {
      return {
        data: respuesta,
        ok: true
      };
    }
    else {
      return {
        data: 'No se pudo obtener el body del mensaje',
        ok: false
      };
    }
  }
  else {
    return {
      data: 'El origen de la petición no está permitido',
      ok: false
    };
  }
}
exports.formateaEmail = (data) => {
  // Ver https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ses/command/SendEmailCommand/
  // Ver https://github.com/awsdocs/aws-doc-sdk-examples/blob/main/javascriptv3/example_code/ses/src/ses_sendemail.js
  // Ver https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_ses_code_examples.html
  const { destinatario, asunto, html, texto } = data;
  return {
    Destination: {
      CcAddresses: [],
      ToAddresses: [
        destinatario,
      ],
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
exports.validaReCAPTCHA = (data) => {
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
        }
        catch (error) {
          reject(error);
        }
      });
    });
    req.on('error', (error) => reject(error));
    req.end();
  });
};

function deCodeBody(event) {
  const data = event.body.toString();
  const regexBoundary = /multipart\/form-data; boundary=(.*)/gm;
  const boundary = event.headers['content-type'].replace(regexBoundary, '$1');
  const variables = [];
  data.split(boundary).forEach((linea, index) => {
    if (linea != '--') {
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
}

function autenticaOrigen(origen) {
  let valido = false;
  const permitidos = [
    /https:\/\/(www.)?o(liver)?castelblanco\.com/g,
    /https:\/\/(www.)?letiende\.co/g,
    /https:\/\/(www.)?bar23\.co/g,
  ];
  permitidos.forEach(permitido => {
    if (origen.match(permitido) === null) valido = true;
  });
  return valido;
}
