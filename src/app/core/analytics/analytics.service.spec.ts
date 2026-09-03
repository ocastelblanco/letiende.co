import { TestBed } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { AnalyticsService, debeCargarAnalytics } from './analytics.service';

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
