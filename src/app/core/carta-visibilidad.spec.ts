import { cartaVisible, resolverHostCarta } from './carta-visibilidad';

describe('cartaVisible', () => {
  it.each(['staging.letiende.co', 'localhost', '127.0.0.1'])('%s ve la carta', (host) => {
    expect(cartaVisible(host)).toBe(true);
  });

  it.each(['letiende.co', 'www.letiende.co', ''])('%j no ve la carta', (host) => {
    expect(cartaVisible(host)).toBe(false);
  });

  it('con la carta publicada, cualquier host la ve', () => {
    expect(cartaVisible('letiende.co', true)).toBe(true);
  });
});

describe('resolverHostCarta', () => {
  it('la cabecera gana sobre la URL', () => {
    const request = new Request('https://otro.com/carta', {
      headers: { 'x-le-tiende-host': 'letiende.co' },
    });
    expect(resolverHostCarta(request)).toBe('letiende.co');
  });

  it('quita el puerto de la cabecera', () => {
    const request = new Request('https://otro.com/carta', {
      headers: { 'x-le-tiende-host': 'localhost:4000' },
    });
    expect(resolverHostCarta(request)).toBe('localhost');
  });

  it('sin cabecera usa el host de la URL', () => {
    expect(resolverHostCarta(new Request('https://staging.letiende.co/carta'))).toBe(
      'staging.letiende.co',
    );
  });

  it('sin petición usa location.hostname del navegador', () => {
    expect(resolverHostCarta(null)).toBe(globalThis.location?.hostname ?? '');
  });
});
