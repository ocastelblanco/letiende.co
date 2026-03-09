/**
 * Lambda de reenvío de correos para letiende.co
 * Recibe eventos de SNS (disparados por SES Receipt Rules) y reenvía
 * cada correo al destino Gmail configurado según la cuenta receptora.
 *
 * Para cambiar, agregar o eliminar redirecciones SIN redesplegar el código,
 * actualizar el parámetro SSM:
 *   Ruta: /letiende/prod/EMAIL_FORWARD_MAP
 *   Formato: {"cuenta@letiende.co": ["destino@gmail.com"], "@letiende.co": ["catch-all@gmail.com"]}
 *
 * Vía AWS CLI:
 *   aws ssm put-parameter --name "/letiende/prod/EMAIL_FORWARD_MAP" --value '{"info@letiende.co":["nuevo@gmail.com"]}' --type String --overwrite --region us-east-1
 *
 * Runtime: nodejs22.x
 */

import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const REGION = 'us-east-1';
const ses = new SESClient({ region: REGION });
const ssm = new SSMClient({ region: REGION });

const FORWARDER_ADDRESS = process.env.FORWARDER_ADDRESS || 'info@letiende.co';
const SSM_PARAM_NAME = process.env.SSM_FORWARD_MAP_PARAM || '/letiende/prod/EMAIL_FORWARD_MAP';

// El mapa se cachea en memoria durante el ciclo de vida del execution environment.
// Cambios en SSM toman efecto en el siguiente cold start o tras ~15 min de inactividad.
let forwardMapCache = null;

async function getForwardMap() {
  if (forwardMapCache) return forwardMapCache;

  const response = await ssm.send(new GetParameterCommand({
    Name: SSM_PARAM_NAME,
    WithDecryption: false,
  }));

  forwardMapCache = JSON.parse(response.Parameter.Value);
  console.log('Mapa de reenvío cargado desde SSM:', JSON.stringify(Object.keys(forwardMapCache)));
  return forwardMapCache;
}

function resolveDestinations(toAddress, forwardMap) {
  const normalized = toAddress.toLowerCase().trim();

  if (forwardMap[normalized]) {
    return { destinations: forwardMap[normalized], matchedKey: normalized };
  }

  const catchAllKey = '@' + normalized.split('@')[1];
  if (forwardMap[catchAllKey]) {
    return { destinations: forwardMap[catchAllKey], matchedKey: catchAllKey };
  }

  return { destinations: null, matchedKey: null };
}

function buildForwardedEmail(msgInfo, forwardTo) {
  const { mail, content } = msgInfo;
  const originalFrom = mail.commonHeaders.from?.[0] ?? 'desconocido@letiende.co';
  const originalTo = mail.commonHeaders.to?.[0] ?? forwardTo;
  const originalSubject = mail.commonHeaders.subject ?? '(sin asunto)';

  // Construir cabeceras del correo reenviado.
  // SES requiere que el From sea una dirección verificada del dominio.
  let headers = `From: ${FORWARDER_ADDRESS}\r\n`;
  headers += `Reply-To: ${originalFrom}\r\n`;
  headers += `X-Original-To: ${originalTo}\r\n`;
  headers += `X-Forwarded-To: ${forwardTo}\r\n`;
  headers += `To: ${forwardTo}\r\n`;
  headers += `Subject: Fwd: ${originalSubject}\r\n`;

  if (!content) {
    return headers + '\r\n(Correo sin contenido)';
  }

  // Preservar cabeceras MIME del correo original para mantener
  // la estructura multipart (HTML, adjuntos, etc.)
  const contentTypeMatch = content.match(/Content-Type:.+\s*boundary.*/);
  if (contentTypeMatch) {
    headers += contentTypeMatch[0] + '\r\n';
  } else {
    const simpleContentType = content.match(/^Content-Type:(.*)/m);
    if (simpleContentType) headers += simpleContentType[0] + '\r\n';
  }

  const transferEncoding = content.match(/^Content-Transfer-Encoding:(.*)/m);
  if (transferEncoding) headers += transferEncoding[0] + '\r\n';

  const mimeVersion = content.match(/^MIME-Version:(.*)/m);
  if (mimeVersion) headers += mimeVersion[0] + '\r\n';

  // Separar y descartar las cabeceras originales; preservar el cuerpo completo
  const parts = content.split('\r\n\r\n');
  parts.shift();

  return headers + '\r\n' + parts.join('\r\n\r\n');
}

export const handler = async (event) => {
  const snsMessage = event.Records[0].Sns.Message;
  const msgInfo = JSON.parse(snsMessage);

  // Descartar spam y virus detectados por SES
  if (
    msgInfo.receipt.spamVerdict?.status === 'FAIL' ||
    msgInfo.receipt.virusVerdict?.status === 'FAIL'
  ) {
    console.log('Mensaje descartado: spam o virus detectado.');
    return;
  }

  const toAddresses = msgInfo.mail.destination ?? [];
  if (toAddresses.length === 0) {
    console.log('Mensaje sin destinatarios, ignorando.');
    return;
  }

  const forwardMap = await getForwardMap();

  for (const toAddress of toAddresses) {
    const { destinations, matchedKey } = resolveDestinations(toAddress, forwardMap);

    if (!destinations) {
      console.log(`Sin destino configurado para: ${toAddress}`);
      continue;
    }

    for (const forwardTo of destinations) {
      const emailContent = buildForwardedEmail(msgInfo, forwardTo);

      const response = await ses.send(new SendRawEmailCommand({
        RawMessage: { Data: Buffer.from(emailContent) },
      }));

      console.log(`Reenviado: ${toAddress} -> ${forwardTo} (regla: "${matchedKey}") | MessageId: ${response.MessageId}`);
    }
  }
};
