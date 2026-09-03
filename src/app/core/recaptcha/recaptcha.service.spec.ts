import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/core';
import { RecaptchaService } from './recaptcha.service';

describe('RecaptchaService', () => {
  let servicio: RecaptchaService;
  let documento: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(RecaptchaService);
    documento = TestBed.inject(DOCUMENT);
    delete window.grecaptcha;
    documento.getElementById('script-recaptcha')?.remove();
  });

  afterEach(() => {
    documento.getElementById('script-recaptcha')?.remove();
    delete window.grecaptcha;
  });

  it('inserta el script de reCAPTCHA con la site key de environment', () => {
    const ejecutar = vi.fn().mockResolvedValue('token-de-prueba');
    const promesa = servicio.obtenerToken('contacto');

    const script = documento.getElementById('script-recaptcha') as HTMLScriptElement;
    expect(script).toBeTruthy();
    expect(script.src).toContain('/recaptcha/api.js?render=');

    // Simula que Google ya cargó el script real.
    window.grecaptcha = { ready: (cb) => cb(), execute: ejecutar };
    script.onload?.(new Event('load'));

    return promesa.then((token) => {
      expect(token).toBe('token-de-prueba');
      expect(ejecutar).toHaveBeenCalledWith(expect.any(String), { action: 'contacto' });
    });
  });

  it('no inserta el script dos veces si ya se cargó', async () => {
    window.grecaptcha = { ready: (cb) => cb(), execute: vi.fn().mockResolvedValue('t') };
    const script = documento.createElement('script');
    script.id = 'script-recaptcha';
    documento.head.appendChild(script);

    await servicio.obtenerToken('contacto');

    expect(documento.querySelectorAll('#script-recaptcha').length).toBe(1);
  });
});
