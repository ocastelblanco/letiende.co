import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';

const { enviarMock, fetchMock } = vi.hoisted(() => ({
  enviarMock: vi.fn(),
  fetchMock: vi.fn(),
}));

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

vi.stubGlobal('fetch', fetchMock);

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

function respuestaSiteverify(cuerpo: Record<string, unknown>) {
  return { json: () => Promise.resolve(cuerpo) };
}

const cuerpoValido = {
  nombre: 'Visitante',
  correo: 'visitante@correo.com',
  mensaje: 'Hola, quiero saber más.',
  consentimientoDatos: true,
  recaptchaToken: 'token-valido',
};

describe('handler de POST /api/contacto', () => {
  beforeEach(() => {
    enviarMock.mockReset();
    enviarMock.mockResolvedValue({});
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      respuestaSiteverify({ success: true, score: 0.9, action: 'contacto' }),
    );
    process.env['SES_REMITENTE'] = 'contacto@letiende.co';
    process.env['RECAPTCHA_SECRET_KEY'] = 'secreto-de-prueba';
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

  it('el honeypot lleno responde 200 sin enviar nada ni consultar reCAPTCHA', async () => {
    const respuesta = await invocar(
      { ...cuerpoValido, sitioWeb: 'http://bot.example' },
      '203.0.113.40',
    );
    expect(respuesta.statusCode).toBe(200);
    expect(enviarMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
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

  describe('reCAPTCHA v3', () => {
    it('rechaza si no viene ningún token', async () => {
      const respuesta = await invocar(
        { ...cuerpoValido, recaptchaToken: undefined },
        '198.51.100.10',
      );
      expect(respuesta.statusCode).toBe(400);
      expect(enviarMock).not.toHaveBeenCalled();
    });

    it('verifica el token contra la Site Verify API con el secreto del servidor, nunca uno del cliente', async () => {
      await invocar(cuerpoValido, '198.51.100.11');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://www.google.com/recaptcha/api/siteverify');
      const cuerpoEnviado = (opciones.body as URLSearchParams).toString();
      expect(cuerpoEnviado).toContain('secret=secreto-de-prueba');
      expect(cuerpoEnviado).toContain('response=token-valido');
      expect(cuerpoEnviado).toContain('remoteip=198.51.100.11');
    });

    it('rechaza si Google responde success: false', async () => {
      fetchMock.mockResolvedValue(respuestaSiteverify({ success: false }));
      const respuesta = await invocar(cuerpoValido, '198.51.100.12');
      expect(respuesta.statusCode).toBe(400);
      expect(enviarMock).not.toHaveBeenCalled();
    });

    it('rechaza si el puntaje está por debajo del umbral (0.5)', async () => {
      fetchMock.mockResolvedValue(
        respuestaSiteverify({ success: true, score: 0.2, action: 'contacto' }),
      );
      const respuesta = await invocar(cuerpoValido, '198.51.100.13');
      expect(respuesta.statusCode).toBe(400);
      expect(enviarMock).not.toHaveBeenCalled();
    });

    it('rechaza si la acción no coincide con "contacto" (posible token reciclado de otro formulario)', async () => {
      fetchMock.mockResolvedValue(
        respuestaSiteverify({ success: true, score: 0.9, action: 'otra-cosa' }),
      );
      const respuesta = await invocar(cuerpoValido, '198.51.100.14');
      expect(respuesta.statusCode).toBe(400);
      expect(enviarMock).not.toHaveBeenCalled();
    });

    it('rechaza sin explotar si la Site Verify API falla o no responde', async () => {
      fetchMock.mockRejectedValue(new Error('network error'));
      const respuesta = await invocar(cuerpoValido, '198.51.100.15');
      expect(respuesta.statusCode).toBe(400);
      expect(enviarMock).not.toHaveBeenCalled();
    });

    it('rechaza si RECAPTCHA_SECRET_KEY no está configurado, sin llamar a Google', async () => {
      delete process.env['RECAPTCHA_SECRET_KEY'];
      const respuesta = await invocar(cuerpoValido, '198.51.100.16');
      expect(respuesta.statusCode).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(enviarMock).not.toHaveBeenCalled();
    });
  });
});
