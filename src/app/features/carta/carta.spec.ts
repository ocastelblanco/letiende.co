import { PLATFORM_ID, REQUEST, RESPONSE_INIT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '@environments/environment';
import { _reiniciarCacheCartaParaPruebas } from '@core/api/carta.service';
import { MenuComandante } from './armar-carta';
import { CartaComponent } from './carta';

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

describe('CartaComponent', () => {
  let urlContenidoOriginal: string;

  beforeEach(() => {
    _reiniciarCacheCartaParaPruebas();
    urlContenidoOriginal = environment.urlContenidoCartaWebApp;
    environment.urlContenidoCartaWebApp = '';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(menuFalso) }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    environment.urlContenidoCartaWebApp = urlContenidoOriginal;
  });

  async function renderizar(host: string) {
    const respuestaInit: { status?: number } = {};
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        {
          provide: REQUEST,
          useValue: new Request('https://x/carta', { headers: { 'x-le-tiende-host': host } }),
        },
        { provide: RESPONSE_INIT, useValue: respuestaInit },
      ],
    });
    const fixture = TestBed.createComponent(CartaComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return { html: fixture.nativeElement as HTMLElement, respuestaInit };
  }

  it.each(['letiende.co', 'www.letiende.co'])(
    'en %s responde 404 y no muestra la carta',
    async (host) => {
      const { html, respuestaInit } = await renderizar(host);

      expect(respuestaInit.status).toBe(404);
      expect(html.querySelector('app-no-encontrada')).not.toBeNull();
      expect(html.querySelector('h2')).toBeNull();
      expect(html.textContent).not.toContain('$');
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it('en staging muestra la card con su precio y no fija 404', async () => {
    const { html, respuestaInit } = await renderizar('staging.letiende.co');

    expect(respuestaInit.status).toBeUndefined();
    expect(html.querySelector('app-no-encontrada')).toBeNull();
    expect(html.querySelector('h2')?.textContent).toContain('Bebidas de cafe');
    expect(html.textContent).toContain('$6.600');
  });
});
