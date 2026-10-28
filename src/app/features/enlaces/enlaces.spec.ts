import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EnlacesService } from '@core/api/enlaces.service';
import { EnlacesArmados } from './armar-enlaces';
import { EnlacesComponent } from './enlaces';

const armados: EnlacesArmados = {
  paneles: [
    {
      titulo: 'Pódbar',
      logo: 'podbar',
      barras: [
        {
          titulo: 'T3',
          enlaces: [
            { icono: 'youtube', url: 'https://www.youtube.com/@x', etiqueta: 'Ver en YouTube' },
            { icono: 'spotify', url: 'https://open.spotify.com/x', etiqueta: 'Ver en Spotify' },
          ],
        },
        {
          titulo: 'T1 y T2',
          enlaces: [{ icono: 'enlace', url: 'https://bar23.co/podbar', etiqueta: 'Abrir enlace' }],
        },
      ],
    },
    {
      titulo: 'Otro panel',
      logo: null,
      barras: [
        {
          titulo: 'Barra',
          enlaces: [{ icono: 'bar23', url: 'https://bar23.co', etiqueta: 'Oír en bar23.co' }],
        },
      ],
    },
  ],
};

function crear(valor: EnlacesArmados | null) {
  const enlaces = { hasValue: () => valor !== null, value: () => valor };
  TestBed.configureTestingModule({
    providers: [{ provide: EnlacesService, useValue: { enlaces } }],
  });
  const fixture = TestBed.createComponent(EnlacesComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('EnlacesComponent', () => {
  it('pinta un solo h1 oculto, el logo y un panel por categoría', () => {
    const el = crear(armados);

    expect(el.querySelectorAll('h1')).toHaveLength(1);
    expect(el.querySelector('h1')?.classList.contains('sr-only')).toBe(true);
    expect(el.querySelector('img[alt="Le Tiende"]')).toBeTruthy();
    expect(el.querySelectorAll('section')).toHaveLength(2);
  });

  it('el panel con logo muestra la imagen del logo; sin logo, el título como h2', () => {
    const el = crear(armados);

    const logo = el.querySelector<HTMLImageElement>('img[alt="Pódbar"]');
    expect(logo?.getAttribute('src')).toBe('/enlaces/logo-podbar.svg');
    expect(el.querySelector('h2')?.textContent).toContain('Otro panel');
  });

  it('cada enlace es un <a> https que abre aparte, con aria-label y title de la etiqueta', () => {
    const el = crear(armados);
    const youtube = el.querySelector<HTMLAnchorElement>('a[aria-label="Ver en YouTube"]');

    expect(youtube?.getAttribute('href')).toBe('https://www.youtube.com/@x');
    expect(youtube?.getAttribute('target')).toBe('_blank');
    expect(youtube?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(youtube?.getAttribute('title')).toBe('Ver en YouTube');
    expect(youtube?.querySelector('img')?.getAttribute('alt')).toBe('');
    expect(youtube?.querySelector('img')?.getAttribute('src')).toBe('/enlaces/icono-youtube.svg');
  });

  it('conserva el orden de barras y enlaces, y los títulos de barra tal cual', () => {
    const el = crear(armados);

    expect(Array.from(el.querySelectorAll('h3')).map((h) => h.textContent?.trim())).toEqual([
      'T3',
      'T1 y T2',
      'Barra',
    ]);
    expect(Array.from(el.querySelectorAll('a')).map((a) => a.getAttribute('aria-label'))).toEqual([
      'Ver en YouTube',
      'Ver en Spotify',
      'Abrir enlace',
      'Oír en bar23.co',
    ]);
  });

  it('los paneles arrancan desplegados y el botón los pliega y los abre', () => {
    const el = crear(armados);
    const boton = el.querySelector<HTMLButtonElement>('section button');
    const cuerpo = el.querySelector<HTMLElement>('#cuerpo-panel-0');

    expect(boton?.getAttribute('aria-expanded')).toBe('true');
    expect(boton?.getAttribute('aria-controls')).toBe('cuerpo-panel-0');
    expect(cuerpo?.hidden).toBe(false);

    boton?.click();
    TestBed.tick();
    expect(boton?.getAttribute('aria-expanded')).toBe('false');
    expect(cuerpo?.hidden).toBe(true);

    boton?.click();
    TestBed.tick();
    expect(boton?.getAttribute('aria-expanded')).toBe('true');
    expect(cuerpo?.hidden).toBe(false);
  });

  it('sin fuente (503) muestra el mensaje y ningún enlace', () => {
    const el = crear(null);

    expect(el.textContent).toContain('Los enlaces no están disponibles en este momento.');
    expect(el.querySelectorAll('a')).toHaveLength(0);
  });

  it('con cero paneles muestra un estado vacío, no el mensaje de error', () => {
    const el = crear({ paneles: [] });

    expect(el.textContent).toContain('Aún no hay enlaces para mostrar.');
    expect(el.textContent).not.toContain('no están disponibles');
  });

  it('fija noindex,follow y no agrega JSON-LD propio', () => {
    const el = crear(armados);
    const documento = TestBed.inject(DOCUMENT);

    expect(documento.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex,follow',
    );
    expect(el.querySelector('script[type="application/ld+json"]')).toBeNull();
  });
});
