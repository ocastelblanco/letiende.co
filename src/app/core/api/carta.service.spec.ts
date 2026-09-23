import { ApplicationRef, PLATFORM_ID, RESPONSE_INIT, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '@environments/environment';
import { CartaArmada, MenuComandante } from '@features/carta/armar-carta';
import { CLAVE_CARTA_ARMADA, CartaService, _reiniciarCacheCartaParaPruebas } from './carta.service';

const menuFalso: MenuComandante = {
  updatedAt: '2026-09-22T00:00:00.000Z',
  items: [
    {
      name: 'Espresso',
      description: null,
      additions: [],
      variants: [],
      category: 'bebidas',
      subcategory: 'de_cafe',
      basePrice: 6600,
    },
  ],
};

function respuestaJson(cuerpo: unknown, ok = true, status = 200) {
  return { ok, status, json: () => Promise.resolve(cuerpo) } as Response;
}

describe('CartaService', () => {
  let appRef: ApplicationRef;
  let fetchMock: ReturnType<typeof vi.fn>;
  let urlContenidoOriginal: string;

  beforeEach(() => {
    _reiniciarCacheCartaParaPruebas();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    urlContenidoOriginal = environment.urlContenidoCartaWebApp;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    environment.urlContenidoCartaWebApp = urlContenidoOriginal;
  });

  function configurar(plataforma: 'server' | 'browser', respuestaInit?: { status?: number }) {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: plataforma },
        ...(respuestaInit ? [{ provide: RESPONSE_INIT, useValue: respuestaInit }] : []),
      ],
    });
    appRef = TestBed.inject(ApplicationRef);
  }

  it('en el navegador, sin TransferState, no hace ninguna petición y no hay carta', async () => {
    configurar('browser');
    const servicio = TestBed.inject(CartaService);
    TestBed.tick();
    await appRef.whenStable();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(servicio.carta.hasValue() ? servicio.carta.value() : null).toBeNull();
  });

  it('en el navegador, con la carta en TransferState, la usa sin hacer ninguna petición', async () => {
    configurar('browser');
    const cartaFalsa: CartaArmada = { cards: [] };
    TestBed.inject(TransferState).set(CLAVE_CARTA_ARMADA, cartaFalsa);
    const servicio = TestBed.inject(CartaService);
    TestBed.tick();
    await appRef.whenStable();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(servicio.carta.value()).toEqual(cartaFalsa);
  });

  it('en el servidor, con carta armada, la deja en TransferState para el navegador', async () => {
    environment.urlContenidoCartaWebApp = '';
    fetchMock.mockResolvedValue(respuestaJson(menuFalso));

    configurar('server');
    const servicio = TestBed.inject(CartaService);
    TestBed.tick();
    await appRef.whenStable();

    expect(TestBed.inject(TransferState).get(CLAVE_CARTA_ARMADA, null)).toEqual(
      servicio.carta.value(),
    );
  });

  it('en el servidor, con las dos fuentes disponibles, arma la carta', async () => {
    environment.urlContenidoCartaWebApp = 'https://script.google.com/macros/s/ID/exec';
    fetchMock.mockImplementation((url: string) => {
      if (url === environment.urlMenuComandante) return Promise.resolve(respuestaJson(menuFalso));
      return Promise.resolve(
        respuestaJson({
          publicadoEn: '2026-09-22T21:00:00.000Z',
          secciones: [],
          diccionario: { adiciones: {}, variantes: {} },
        }),
      );
    });

    configurar('server');
    const servicio = TestBed.inject(CartaService);
    TestBed.tick();
    await appRef.whenStable();

    expect(servicio.carta.hasValue() ? servicio.carta.value() : null).toEqual({
      cards: [
        {
          categoria: 'bebidas',
          subcategoria: 'de_cafe',
          etiqueta: 'Bebidas de cafe',
          descripcion: null,
          icono: 'restaurant_menu',
          destacada: false,
          productos: [
            {
              nombre: 'Espresso',
              descripcion: null,
              precio: 6600,
              precioFormateado: '$6.600',
              marcas: [],
              variantes: [],
            },
          ],
          notasAlPie: [],
        },
      ],
    });
  });

  it('sin `urlContenidoCartaWebApp` configurada, arma la carta solo con menu.json', async () => {
    environment.urlContenidoCartaWebApp = '';
    fetchMock.mockResolvedValue(respuestaJson(menuFalso));

    configurar('server');
    const servicio = TestBed.inject(CartaService);
    TestBed.tick();
    await appRef.whenStable();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(environment.urlMenuComandante);
    expect(servicio.carta.hasValue() && servicio.carta.value()?.cards).toHaveLength(1);
  });

  it('si falla la lectura del contenido editorial, degrada: la carta se arma igual', async () => {
    environment.urlContenidoCartaWebApp = 'https://script.google.com/macros/s/ID/exec';
    fetchMock.mockImplementation((url: string) => {
      if (url === environment.urlMenuComandante) return Promise.resolve(respuestaJson(menuFalso));
      return Promise.reject(new Error('Web App caída'));
    });

    configurar('server');
    const servicio = TestBed.inject(CartaService);
    TestBed.tick();
    await appRef.whenStable();

    expect(servicio.carta.hasValue() && servicio.carta.value()?.cards).toHaveLength(1);
  });

  it('sin menu.json y sin copia buena en caché, marca 503 y no hay carta', async () => {
    environment.urlContenidoCartaWebApp = '';
    fetchMock.mockResolvedValue(respuestaJson({ error: 'no disponible' }, false, 500));

    const respuestaInit: { status?: number } = {};
    configurar('server', respuestaInit);
    const servicio = TestBed.inject(CartaService);
    TestBed.tick();
    await appRef.whenStable();

    expect(respuestaInit.status).toBe(503);
    expect(TestBed.inject(TransferState).get(CLAVE_CARTA_ARMADA, null)).toBeNull();
    expect(servicio.carta.hasValue() ? servicio.carta.value() : null).toBeNull();
  });

  it('si menu.json falla pero hay una copia buena en caché de una lectura anterior, no hay 503', async () => {
    environment.urlContenidoCartaWebApp = '';
    fetchMock.mockResolvedValueOnce(respuestaJson(menuFalso));

    configurar('server');
    let servicio = TestBed.inject(CartaService);
    TestBed.tick();
    await appRef.whenStable();
    expect(servicio.carta.hasValue() && servicio.carta.value()?.cards).toHaveLength(1);

    // Segunda "petición" (nuevo injector, como en un segundo request SSR):
    // menu.json ahora falla, pero la caché de módulo persiste entre los dos
    // — es justo lo que hace que este caso sea distinto del anterior.
    TestBed.resetTestingModule();
    fetchMock.mockResolvedValue(respuestaJson({ error: 'caído' }, false, 500));
    const respuestaInit: { status?: number } = {};
    configurar('server', respuestaInit);
    servicio = TestBed.inject(CartaService);
    TestBed.tick();
    await appRef.whenStable();

    expect(respuestaInit.status).toBeUndefined();
    expect(servicio.carta.hasValue() && servicio.carta.value()?.cards).toHaveLength(1);
  });
});
