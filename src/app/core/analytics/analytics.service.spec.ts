import { TestBed } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { AnalyticsService, debeCargarAnalytics, encolarConfiguracion } from './analytics.service';

describe('encolarConfiguracion', () => {
  it('empuja js y config como objetos arguments, que es lo único que gtag.js procesa', () => {
    const dataLayer: unknown[] = [];
    encolarConfiguracion(dataLayer, 'G-PRUEBA');

    expect(dataLayer.map((e) => Object.prototype.toString.call(e))).toEqual([
      '[object Arguments]',
      '[object Arguments]',
    ]);
    expect((dataLayer[0] as unknown[])[0]).toBe('js');
    expect(Array.from(dataLayer[1] as unknown[])).toEqual(['config', 'G-PRUEBA']);
  });
});

describe('debeCargarAnalytics', () => {
  it('carga solo en el host de producción', () => {
    expect(debeCargarAnalytics('letiende.co')).toBe(true);
  });

  it('no carga en staging, para no contaminar las métricas reales', () => {
    expect(debeCargarAnalytics('staging.letiende.co')).toBe(false);
  });

  it('no carga en localhost', () => {
    expect(debeCargarAnalytics('localhost')).toBe(false);
  });
});

describe('AnalyticsService', () => {
  afterEach(() => {
    document.querySelectorAll('script[src*="googletagmanager"]').forEach((el) => el.remove());
  });

  it('no inserta el script de gtag fuera del host de producción', async () => {
    TestBed.configureTestingModule({});
    TestBed.inject(AnalyticsService);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();
  });
});
