import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BarraNavegacion } from './barra-navegacion';

@Component({ selector: 'app-vacio-de-prueba', template: '' })
class ComponenteVacioDePrueba {}

describe('BarraNavegacion', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarraNavegacion],
      providers: [
        provideRouter([
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
});
