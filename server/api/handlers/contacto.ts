import type { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const clienteSes = new SESClient({});

const TOPE_NOMBRE_CORREO = 200;
const TOPE_MENSAJE = 2000;

// Antiabuso en memoria del propio contenedor de la Lambda (CLAUDE.md §5, A07):
// no se comparte entre invocaciones concurrentes ni sobrevive un cold start
// — mitigación parcial, no una garantía. Se prefirió a una tabla nueva de
// DynamoDB (choca con PRD §9/D-1, "sin base de datos propia") y a una regla
// de tasa de AWS WAF (infraestructura de CloudFront, T-13, que no existe
// todavía). Ver docs/MEMORY.md, T-0009, para el trade-off completo.
const VENTANA_LIMITE_MS = 10 * 60 * 1000;
const MAX_PETICIONES_POR_IP = 5;
const peticionesPorIp = new Map<string, number[]>();

function excedeLimite(ip: string): boolean {
  const ahora = Date.now();
  const previas = (peticionesPorIp.get(ip) ?? []).filter((t) => ahora - t < VENTANA_LIMITE_MS);
  previas.push(ahora);
  peticionesPorIp.set(ip, previas);
  return previas.length > MAX_PETICIONES_POR_IP;
}

// Encabezados de correo (CLAUDE.md §5, A03): un salto de línea en un campo
// que termina en el asunto o en un encabezado permite inyectarlos y
// convertir el formulario en un relé de spam.
function limpiarTexto(valor: unknown, tope: number): string {
  if (typeof valor !== 'string') return '';
  return valor
    .replace(/[\r\n]/g, ' ')
    .trim()
    .slice(0, tope);
}

interface CuerpoContacto {
  readonly nombre?: unknown;
  readonly correo?: unknown;
  readonly mensaje?: unknown;
  readonly consentimientoDatos?: unknown;
  /** Honeypot — un humano nunca lo llena (contacto.html lo oculta de verdad). */
  readonly sitioWeb?: unknown;
  /** Token de reCAPTCHA v3, obtenido en el navegador justo antes de enviar. */
  readonly recaptchaToken?: unknown;
}

// reCAPTCHA v3 (developers.google.com/recaptcha/docs/v3, verificado el
// 02/09/2026): el legado de este proyecto (rama `2025`, ya abandonada) tenía
// una función real de verificación (`validaReCAPTCHA` en
// `external_resources/AWS_Lambda/libs/funciones.mjs`) y una nota de
// seguridad explícita ("el endpoint de envío nunca debe ejecutarse sin un
// token reCAPTCHA válido") — pero esa verificación nunca llegó a conectarse
// de verdad con el envío del correo, quedó como dos endpoints separados.
// Aquí sí queda en la misma petición que el envío, como la nota original
// pedía.
const RECAPTCHA_UMBRAL_PUNTAJE = 0.5; // recomendación oficial por defecto

async function tokenReCaptchaValido(token: unknown, ip: string): Promise<boolean> {
  if (typeof token !== 'string' || !token) return false;

  const secreto = process.env['RECAPTCHA_SECRET_KEY'] ?? '';
  if (!secreto) return false;

  try {
    const respuesta = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: secreto, response: token, remoteip: ip }),
    });
    const resultado = (await respuesta.json()) as {
      success?: boolean;
      score?: number;
      action?: string;
    };
    return (
      resultado.success === true &&
      resultado.action === 'contacto' &&
      typeof resultado.score === 'number' &&
      resultado.score >= RECAPTCHA_UMBRAL_PUNTAJE
    );
  } catch (error) {
    console.error(
      'Error verificando reCAPTCHA:',
      error instanceof Error ? error.message : 'error desconocido',
    );
    return false;
  }
}

function respuesta(statusCode: number, cuerpo: Record<string, unknown>): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  };
}

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * `POST /api/contacto` — Lambda separada de `ssr` (tech-specs.md §1), con su
 * propio permiso mínimo de SES: un bug en este handler no puede tumbar el
 * SSR, y `ssr` no tiene ningún permiso de SES que un XSS pudiera abusar.
 *
 * Nunca escribe `nombre`, `correo` ni `mensaje` en los logs (Ley 1581,
 * CLAUDE.md) — solo el mensaje de error de SES, si el envío falla.
 */
export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyResultV2> => {
  const ip = event.requestContext.http.sourceIp;
  if (excedeLimite(ip)) {
    return respuesta(429, { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' });
  }

  let cuerpo: CuerpoContacto;
  try {
    cuerpo = JSON.parse(event.body ?? '{}');
  } catch {
    return respuesta(400, { error: 'Cuerpo inválido.' });
  }

  // Honeypot: nunca se le avisa a quien lo llenó con un 4xx — eso
  // confirmaría que el campo es una trampa. Se responde como si el mensaje
  // se hubiera enviado, sin enviar nada de verdad.
  if (limpiarTexto(cuerpo.sitioWeb, TOPE_NOMBRE_CORREO)) {
    return respuesta(200, { enviado: true });
  }

  if (!(await tokenReCaptchaValido(cuerpo.recaptchaToken, ip))) {
    return respuesta(400, { error: 'No se pudo verificar que la solicitud viene de un humano.' });
  }

  if (cuerpo.consentimientoDatos !== true) {
    return respuesta(400, { error: 'Falta el consentimiento de tratamiento de datos.' });
  }

  const nombre = limpiarTexto(cuerpo.nombre, TOPE_NOMBRE_CORREO);
  const correo = limpiarTexto(cuerpo.correo, TOPE_NOMBRE_CORREO);
  const mensaje = limpiarTexto(cuerpo.mensaje, TOPE_MENSAJE);

  if (!nombre || !mensaje || !CORREO_VALIDO.test(correo)) {
    return respuesta(400, { error: 'Faltan campos obligatorios o el correo no es válido.' });
  }

  const remitente = process.env['SES_REMITENTE'] ?? '';

  try {
    await clienteSes.send(
      new SendEmailCommand({
        Source: remitente,
        Destination: { ToAddresses: [remitente] },
        ReplyToAddresses: [correo],
        Message: {
          Subject: { Data: `Nuevo mensaje de contacto de ${nombre}`, Charset: 'UTF-8' },
          Body: { Text: { Data: mensaje, Charset: 'UTF-8' } },
        },
      }),
    );
  } catch (error) {
    console.error(
      'Error enviando el correo de contacto:',
      error instanceof Error ? error.message : 'error desconocido',
    );
    return respuesta(500, { error: 'No se pudo enviar el mensaje. Intenta de nuevo más tarde.' });
  }

  return respuesta(200, { enviado: true });
};
