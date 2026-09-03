import { DOCUMENT, Injectable, inject } from '@angular/core';
import { environment } from '@environments/environment';

declare global {
  interface Window {
    grecaptcha?: {
      ready(callback: () => void): void;
      execute(siteKey: string, options: { action: string }): Promise<string>;
    };
  }
}

/**
 * reCAPTCHA v3 (developers.google.com/recaptcha/docs/v3, verificado el
 * 02/09/2026) — invisible, sin fricción para el visitante, con un puntaje
 * de 0 a 1 en vez de un desafío. Solo se usa en `/contacto`: el script se
 * carga la primera vez que se pide un token, no de entrada en toda la app.
 */
@Injectable({ providedIn: 'root' })
export class RecaptchaService {
  private readonly documento = inject(DOCUMENT);
  private cargando: Promise<void> | null = null;

  private cargarScript(): Promise<void> {
    if (this.documento.getElementById('script-recaptcha')) {
      return this.esperarListo();
    }
    this.cargando ??= new Promise<void>((resolve, reject) => {
      const script = this.documento.createElement('script');
      script.id = 'script-recaptcha';
      script.src = `https://www.google.com/recaptcha/api.js?render=${environment.recaptchaSiteKey}`;
      script.onload = () => this.esperarListo().then(resolve, reject);
      script.onerror = () => reject(new Error('No se pudo cargar reCAPTCHA.'));
      this.documento.head.appendChild(script);
    });
    return this.cargando;
  }

  private esperarListo(): Promise<void> {
    return new Promise((resolve) => window.grecaptcha?.ready(() => resolve()));
  }

  /** Obtiene un token nuevo — cada token es de un solo uso y vale ~2 minutos, así que se pide justo antes de enviar, nunca antes. */
  async obtenerToken(accion: string): Promise<string> {
    await this.cargarScript();
    if (!window.grecaptcha) {
      throw new Error('reCAPTCHA no está disponible.');
    }
    return window.grecaptcha.execute(environment.recaptchaSiteKey, { action: accion });
  }
}
