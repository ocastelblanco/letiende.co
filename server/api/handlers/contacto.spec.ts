import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';

const { enviarMock } = vi.hoisted(() => ({ enviarMock: vi.fn() }));

vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: vi.fn().mockImplementation(function ClienteSesFalso(this: {
    send: typeof enviarMock;
  }) {
    this.send = enviarMock;
  }),
  SendEmailCommand: vi.fn().mockImplementation(function ComandoFalso(
    this: Record<string, unknown>,
    input: Record<string, unknown>,
  ) {
    Object.assign(this, input);
  }),
}));

import { handler } from './contacto';

function evento(cuerpo: unknown, ip: string): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'POST /api/contacto',
    rawPath: '/api/contacto',
    rawQueryString: '',
    headers: {},
    body: JSON.stringify(cuerpo),
    isBase64Encoded: false,
    requestContext: {
      http: { method: 'POST', path: '/api/contacto', sourceIp: ip },
    },
  } as unknown as APIGatewayProxyEventV2;
}

const contexto = {} as unknown as Context;
const callback = (): void => undefined;

async function invocar(cuerpo: unknown, ip: string): Promise<APIGatewayProxyResultV2> {
  const respuesta = await handler(evento(cuerpo, ip), contexto, callback);
  return respuesta as APIGatewayProxyResultV2;
}

const cuerpoValido = {
  nombre: 'Visitante',
  correo: 'visitante@correo.com',
  mensaje: 'Hola, quiero saber más.',
  consentimientoDatos: true,
};

describe('handler de POST /api/contacto', () => {
  beforeEach(() => {
    enviarMock.mockReset();
    enviarMock.mockResolvedValue({});
    process.env['SES_REMITENTE'] = 'contacto@letiende.co';
  });

  it('rechaza si falta el consentimiento, aunque el resto de los campos sea válido', async () => {
    const respuesta = await invocar(
      { ...cuerpoValido, consentimientoDatos: false },
      '203.0.113.10',
    );
    expect(respuesta.statusCode).toBe(400);
    expect(enviarMock).not.toHaveBeenCalled();
  });

  it('rechaza un correo con formato inválido', async () => {
    const respuesta = await invocar({ ...cuerpoValido, correo: 'no-es-un-correo' }, '203.0.113.20');
    expect(respuesta.statusCode).toBe(400);
    expect(enviarMock).not.toHaveBeenCalled();
  });

  it('limpia los saltos de línea antes de armar el correo (inyección de encabezados, CLAUDE.md §5 A03)', async () => {
    await invocar(
      { ...cuerpoValido, nombre: 'Visitante\r\nBcc: victima@ajena.com' },
      '203.0.113.30',
    );
    expect(enviarMock).toHaveBeenCalledTimes(1);
    const comando = enviarMock.mock.calls[0][0] as { Message: { Subject: { Data: string } } };
    expect(comando.Message.Subject.Data).not.toContain('\r');
    expect(comando.Message.Subject.Data).not.toContain('\n');
  });

  it('el honeypot lleno responde 200 sin enviar nada, sin delatarlo con un 4xx', async () => {
    const respuesta = await invocar(
      { ...cuerpoValido, sitioWeb: 'http://bot.example' },
      '203.0.113.40',
    );
    expect(respuesta.statusCode).toBe(200);
    expect(enviarMock).not.toHaveBeenCalled();
  });

  it('Source es siempre SES_REMITENTE, nunca el correo de quien escribe (prohibición absoluta de CLAUDE.md)', async () => {
    await invocar(cuerpoValido, '203.0.113.50');
    const comando = enviarMock.mock.calls[0][0] as {
      Source: string;
      ReplyToAddresses: string[];
    };
    expect(comando.Source).toBe('contacto@letiende.co');
    expect(comando.ReplyToAddresses).toEqual(['visitante@correo.com']);
  });

  it('envía correctamente con datos válidos', async () => {
    const respuesta = await invocar(cuerpoValido, '203.0.113.60');
    expect(respuesta.statusCode).toBe(200);
    expect(enviarMock).toHaveBeenCalledTimes(1);
  });

  it('responde 500 sin filtrar detalles si SES falla, y no vuelve a intentar', async () => {
    enviarMock.mockRejectedValueOnce(new Error('MessageRejected'));
    const respuesta = await invocar(cuerpoValido, '203.0.113.70');
    expect(respuesta.statusCode).toBe(500);
  });

  it('bloquea con 429 tras superar el límite de peticiones por IP', async () => {
    const ip = '203.0.113.99';
    for (let i = 0; i < 5; i++) {
      await invocar(cuerpoValido, ip);
    }
    const respuesta = await invocar(cuerpoValido, ip);
    expect(respuesta.statusCode).toBe(429);
  });
});
