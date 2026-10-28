import { ApplicationRef, PLATFORM_ID, RESPONSE_INIT, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '@environments/environment';
import { EnlacesArmados } from '@features/enlaces/armar-enlaces';
import {
  CLAVE_ENLACES,
  EnlacesService,
  _reiniciarCacheEnlacesParaPruebas,
} from './enlaces.service';

const URL_FALSA = 'https://script.google.com/macros/s/ID/exec';

const contenidoFalso = {
  publicadoEn: '2026-10-27T21:00:00.000Z',
  paneles: [
    {
      titulo: 'Pódbar',
      logo: 'podbar',
      barras: [
        {
          titulo: 'T3',
          enlaces: [{ icono: 'youtube', url: 'https://www.youtube.com/@x', etiqueta: '' }],
        },
      ],
    },
  ],
};

function respuestaJson(cuerpo: unknown, ok = true, status = 200) {
  return { ok, status, json: () => Promise.resolve(cuerpo) } as Response;
}

describe('EnlacesService', () => {
  let appRef: ApplicationRef;
  let fetchMock: ReturnType<typeof vi.fn>;
  let urlOriginal: string;

  beforeEach(() => {
    _reiniciarCacheEnlacesParaPruebas();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    urlOriginal = environment.urlContenidoEnlacesWebApp;
    environment.urlContenidoEnlacesWebApp = URL_FALSA;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    environment.urlContenidoEnlacesWebApp = urlOriginal;
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

  async function cargar() {
    const servicio = TestBed.inject(EnlacesService);
    TestBed.tick();
    await appRef.whenStable();
    return servicio;
  }

  it('en el navegador, sin TransferState, no hace ninguna petición y no hay enlaces', async () => {
    configurar('browser');
    const servicio = await cargar();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(servicio.enlaces.hasValue() ? servicio.enlaces.value() : null).toBeNull();
  });

  it('en el navegador, con los enlaces en TransferState, los usa sin hacer ninguna petición', async () => {
    configurar('browser');
    const armados: EnlacesArmados = { paneles: [] };
    TestBed.inject(TransferState).set(CLAVE_ENLACES, armados);
    const servicio = await cargar();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(servicio.enlaces.value()).toEqual(armados);
  });

  it('en el servidor, lee la URL de la Web App, arma los enlaces y los deja en TransferState', async () => {
    fetchMock.mockResolvedValue(respuestaJson(contenidoFalso));
    configurar('server');
    const servicio = await cargar();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(URL_FALSA);
    const enlaces = servicio.enlaces.hasValue() ? servicio.enlaces.value() : null;
    expect(enlaces?.paneles[0].barras[0].enlaces[0]).toEqual({
      icono: 'youtube',
      url: 'https://www.youtube.com/@x',
      etiqueta: 'Ver en YouTube',
    });
    expect(TestBed.inject(TransferState).get(CLAVE_ENLACES, null)).toEqual(enlaces);
  });

  it('descarta en el servidor un enlace con URL no segura que llegue desde la fuente', async () => {
    fetchMock.mockResolvedValue(
      respuestaJson({
        paneles: [
          {
            titulo: 'P',
            barras: [{ titulo: 'B', enlaces: [{ icono: 'youtube', url: 'javascript:alert(1)' }] }],
          },
        ],
      }),
    );
    configurar('server');
    const servicio = await cargar();

    expect(servicio.enlaces.hasValue() && servicio.enlaces.value()?.paneles).toEqual([]);
  });

  it('sin fuente y sin copia buena en caché, marca 503 y no hay enlaces', async () => {
    fetchMock.mockResolvedValue(respuestaJson({ error: 'no disponible' }, false, 500));
    const respuestaInit: { status?: number } = {};
    configurar('server', respuestaInit);
    const servicio = await cargar();

    expect(respuestaInit.status).toBe(503);
    expect(TestBed.inject(TransferState).get(CLAVE_ENLACES, null)).toBeNull();
    expect(servicio.enlaces.hasValue() ? servicio.enlaces.value() : null).toBeNull();
  });

  it('si la fuente rechaza la petición (red caída), también marca 503', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));
    const respuestaInit: { status?: number } = {};
    configurar('server', respuestaInit);
    await cargar();

    expect(respuestaInit.status).toBe(503);
  });

  it('sin `urlContenidoEnlacesWebApp` configurada, no hace ninguna petición y marca 503', async () => {
    environment.urlContenidoEnlacesWebApp = '';
    const respuestaInit: { status?: number } = {};
    configurar('server', respuestaInit);
    await cargar();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(respuestaInit.status).toBe(503);
  });

  it('con una copia buena en caché de una lectura anterior, no hay 503 aunque la fuente falle', async () => {
    fetchMock.mockResolvedValueOnce(respuestaJson(contenidoFalso));
    configurar('server');
    let servicio = await cargar();
    expect(servicio.enlaces.hasValue() && servicio.enlaces.value()?.paneles).toHaveLength(1);

    // Segunda "petición" SSR (nuevo injector): la caché de módulo persiste.
    TestBed.resetTestingModule();
    fetchMock.mockResolvedValue(respuestaJson({ error: 'caído' }, false, 500));
    const respuestaInit: { status?: number } = {};
    configurar('server', respuestaInit);
    servicio = await cargar();

    expect(respuestaInit.status).toBeUndefined();
    expect(servicio.enlaces.hasValue() && servicio.enlaces.value()?.paneles).toHaveLength(1);
  });
});
