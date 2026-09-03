import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MetaService } from './meta.service';

describe('MetaService', () => {
  let servicio: MetaService;
  let documento: Document;
  let title: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(MetaService);
    documento = TestBed.inject(DOCUMENT);
    title = TestBed.inject(Title);
  });

  it('fija el título, la descripción y la canónica', () => {
    servicio.actualizar({
      titulo: 'Contacto - Le Tiende',
      descripcion: 'Escríbenos y encuentra cómo llegar.',
      ruta: '/contacto',
    });

    expect(title.getTitle()).toBe('Contacto - Le Tiende');
    expect(documento.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Escríbenos y encuentra cómo llegar.',
    );
    expect(documento.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://letiende.co/contacto',
    );
  });

  it('fija Open Graph y Twitter Card con la imagen por defecto si no se da una', () => {
    servicio.actualizar({ titulo: 'Le Tiende', descripcion: 'Centro cultural.', ruta: '/' });

    expect(documento.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://letiende.co/',
    );
    expect(documento.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://letiende.co/icon-512.png',
    );
    expect(documento.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe(
      'summary_large_image',
    );
  });

  it('reemplaza los valores en vez de duplicar las etiquetas al llamarse dos veces', () => {
    servicio.actualizar({ titulo: 'Le Tiende', descripcion: 'Uno', ruta: '/' });
    servicio.actualizar({ titulo: 'Nosotros - Le Tiende', descripcion: 'Dos', ruta: '/nosotros' });

    expect(documento.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(documento.querySelectorAll('meta[name="description"]').length).toBe(1);
    expect(documento.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Dos',
    );
  });
});
