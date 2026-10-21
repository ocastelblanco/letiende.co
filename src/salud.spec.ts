import { responderSalud } from './salud';

describe('responderSalud', () => {
  it('responde { estado: "ok" } y prohíbe la caché', () => {
    const encabezados: Record<string, string> = {};
    let cuerpo: unknown;
    responderSalud(
      {},
      {
        set: (campo, valor) => (encabezados[campo] = valor),
        json: (c) => (cuerpo = c),
      },
    );
    expect(cuerpo).toEqual({ estado: 'ok' });
    expect(encabezados['Cache-Control']).toBe('no-store');
  });
});
