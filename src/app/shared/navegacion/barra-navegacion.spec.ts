import { Component, REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CARTA_PUBLICADA_TOKEN } from '@core/carta-visibilidad';
import { BarraNavegacion } from './barra-navegacion';

@Component({ selector: 'app-vacio-de-prueba', template: '' })
class ComponenteVacioDePrueba {}

describe('BarraNavegacion', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarraNavegacion],
      providers: [
        provideRouter([
          { path: 'carta', component: ComponenteVacioDePrueba },
          { path: 'nosotros', component: ComponenteVacioDePrueba },
          { path: 'contacto', component: ComponenteVacioDePrueba },
        ]),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(BarraNavegacion);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('marca /nosotros como activo con text-secondary, y no /contacto', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(BarraNavegacion);
    fixture.detectChanges();

    await router.navigateByUrl('/nosotros');
    fixture.detectChanges();

    const enlaces = fixture.nativeElement.querySelectorAll(
      'a[href="/nosotros"]',
    ) as NodeListOf<HTMLAnchorElement>;
    expect(enlaces.length).toBeGreaterThan(0);
    for (const enlace of enlaces) {
      expect(enlace.classList).toContain('text-secondary');
    }
    const contacto = fixture.nativeElement.querySelector(
      'a[href="/contacto"]',
    ) as HTMLAnchorElement;
    expect(contacto.classList).not.toContain('text-secondary');
  });

  it('los enlaces a /cartelera y /libros son <a href> normales, no rutas de Angular', () => {
    const fixture = TestBed.createComponent(BarraNavegacion);
    fixture.detectChanges();

    const cartelera = fixture.nativeElement.querySelector('a[href="/cartelera"]');
    const libros = fixture.nativeElement.querySelector('a[href="/libros"]');
    expect(cartelera).toBeTruthy();
    expect(libros).toBeTruthy();
  });

  it('el botón de menú abre el panel móvil, y Escape lo cierra devolviendo el foco', () => {
    const fixture = TestBed.createComponent(BarraNavegacion);
    fixture.detectChanges();

    const boton = fixture.nativeElement.querySelector(
      'button[aria-controls="panel-menu-movil"]',
    ) as HTMLButtonElement;
    expect(fixture.nativeElement.querySelector('#panel-menu-movil')).toBeNull();

    boton.click();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('#panel-menu-movil') as HTMLElement;
    expect(panel).toBeTruthy();
    expect(boton.getAttribute('aria-expanded')).toBe('true');

    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#panel-menu-movil')).toBeNull();
    expect(document.activeElement).toBe(boton);
  });

  describe('enlace a la carta (ADR-024)', () => {
    function abrirPanel(fixture: ReturnType<typeof TestBed.createComponent<BarraNavegacion>>) {
      (
        fixture.nativeElement.querySelector(
          'button[aria-controls="panel-menu-movil"]',
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('#panel-menu-movil') as HTMLElement;
    }

    it('en un host visible aparece en escritorio y en el panel móvil', () => {
      const fixture = TestBed.createComponent(BarraNavegacion);
      fixture.detectChanges();
      const escritorio = fixture.nativeElement.querySelector('ul a[href="/carta"]');
      expect(escritorio).toBeTruthy();

      const panel = abrirPanel(fixture);
      expect(panel.querySelector('a[href="/carta"]')).toBeTruthy();
    });

    it('en escritorio va entre Librería y Nosotros', () => {
      const fixture = TestBed.createComponent(BarraNavegacion);
      fixture.detectChanges();
      const textos = Array.from(
        (fixture.nativeElement.querySelector('ul') as HTMLElement).querySelectorAll('a'),
      ).map((a) => a.textContent?.trim());
      expect(textos).toEqual([
        'Cartelera',
        'Librería',
        'Carta',
        'Nosotros',
        'Contacto',
        'Preguntas frecuentes',
      ]);
    });

    it('"Carta" es un enlace de carga completa, no routerLink (la carta solo la arma el servidor)', () => {
      const fixture = TestBed.createComponent(BarraNavegacion);
      fixture.detectChanges();
      const enlace = fixture.nativeElement.querySelector('a[href="/carta"]') as HTMLAnchorElement;
      expect(enlace.hasAttribute('routerLink')).toBe(false);
      const panel = abrirPanel(fixture);
      expect(panel.querySelector('a[href="/carta"]')?.hasAttribute('routerLink')).toBe(false);
    });

    it('se marca activo con text-secondary en /carta', async () => {
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(BarraNavegacion);
      fixture.detectChanges();
      await router.navigateByUrl('/carta');
      fixture.detectChanges();
      const enlace = fixture.nativeElement.querySelector('a[href="/carta"]') as HTMLAnchorElement;
      expect(enlace.classList).toContain('text-secondary');
    });

    it('con la carta publicada, letiende.co sí muestra el enlace', () => {
      TestBed.overrideProvider(REQUEST, {
        useValue: new Request('https://example.test/', {
          headers: { 'x-le-tiende-host': 'letiende.co' },
        }),
      });
      const fixture = TestBed.createComponent(BarraNavegacion);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('a[href="/carta"]')).toBeTruthy();
    });

    it('sin publicar, en letiende.co no hay enlace a /carta, ni en escritorio ni en móvil', () => {
      TestBed.overrideProvider(CARTA_PUBLICADA_TOKEN, { useValue: false });
      TestBed.overrideProvider(REQUEST, {
        useValue: new Request('https://example.test/', {
          headers: { 'x-le-tiende-host': 'letiende.co' },
        }),
      });
      const fixture = TestBed.createComponent(BarraNavegacion);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('a[href="/carta"]')).toBeNull();

      const panel = abrirPanel(fixture);
      expect(panel).toBeTruthy();
      expect(fixture.nativeElement.querySelector('a[href="/carta"]')).toBeNull();
    });
  });
});
