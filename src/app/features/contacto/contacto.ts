import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DATOS_NEGOCIO } from '@core/negocio/datos-negocio';
import { environment } from '@environments/environment';
import { MetaService } from '@core/seo/meta.service';
import { JsonLdService } from '@core/seo/json-ld.service';
import { esquemaContactPage, esquemaLocalBusiness, esquemaMigasDePan } from '@core/seo/esquemas';
import { RecaptchaService } from '@core/recaptcha/recaptcha.service';

interface FormularioContacto {
  nombre: FormControl<string>;
  correo: FormControl<string>;
  mensaje: FormControl<string>;
  consentimientoDatos: FormControl<boolean>;
  /** Honeypot — server/api/handlers/contacto.ts lo descarta en silencio si llega lleno. */
  sitioWeb: FormControl<string>;
}

type EstadoEnvio = 'inicial' | 'enviando' | 'enviado' | 'error';

@Component({
  selector: 'app-contacto',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contacto.html',
})
export class ContactoComponent {
  private readonly sanitizador = inject(DomSanitizer);
  private readonly meta = inject(MetaService);
  private readonly jsonLd = inject(JsonLdService);
  private readonly http = inject(HttpClient);
  private readonly recaptcha = inject(RecaptchaService);

  protected readonly datosNegocio = DATOS_NEGOCIO;

  protected readonly formulario = new FormGroup<FormularioContacto>({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    mensaje: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    consentimientoDatos: new FormControl(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
    // Sin validadores: un humano real lo deja vacío. Solo lo llenan los
    // bots que autocompletan cualquier campo del formulario.
    sitioWeb: new FormControl('', { nonNullable: true }),
  });

  protected readonly estadoEnvio = signal<EstadoEnvio>('inicial');

  // URL construida solo con constantes propias (dirección fija y la llave
  // pública de environment, restringida por dominio del lado de Google) —
  // nunca con datos de la petición ni del visitante. No es el caso que
  // prohíbe CLAUDE.md §5 A03 (bypassSecurityTrustHtml sobre contenido de
  // terceros): aquí no hay HTML de terceros, solo una URL de solo lectura
  // que este mismo componente arma de punta a punta.
  protected readonly mapaUrl: SafeResourceUrl = this.sanitizador.bypassSecurityTrustResourceUrl(
    `https://www.google.com/maps/embed/v1/place?key=${environment.googleMapsApiKey}&q=${encodeURIComponent(
      DATOS_NEGOCIO.direccion,
    )}`,
  );

  constructor() {
    this.meta.actualizar({
      titulo: 'Contacto - Le Tiende',
      descripcion: `Escríbenos, encuentra la dirección y los horarios de Le Tiende. ${DATOS_NEGOCIO.direccion}.`,
      ruta: '/contacto',
    });

    this.jsonLd.establecer('ld-pagina', [
      esquemaContactPage(),
      esquemaLocalBusiness(),
      esquemaMigasDePan([
        { nombre: 'Inicio', ruta: '/' },
        { nombre: 'Contacto', ruta: '/contacto' },
      ]),
    ]);
  }

  protected async enviar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.estadoEnvio.set('enviando');

    // Token nuevo en cada envío — un token de reCAPTCHA v3 solo vale una
    // vez y ~2 minutos (developers.google.com/recaptcha/docs/v3), así que
    // no tiene sentido pedirlo antes de que el visitante esté listo para
    // enviar.
    let recaptchaToken: string;
    try {
      recaptchaToken = await this.recaptcha.obtenerToken('contacto');
    } catch {
      this.estadoEnvio.set('error');
      return;
    }

    const { nombre, correo, mensaje, consentimientoDatos, sitioWeb } =
      this.formulario.getRawValue();

    this.http
      .post('/api/contacto', {
        nombre,
        correo,
        mensaje,
        consentimientoDatos,
        sitioWeb,
        recaptchaToken,
      })
      .subscribe({
        next: () => {
          this.estadoEnvio.set('enviado');
          this.formulario.reset({ consentimientoDatos: false });
        },
        error: () => {
          // Nunca se sabe aquí si fue un 4xx (dato inválido que igual pasó la
          // validación del navegador) o un 5xx (SES caído) — el mensaje se
          // queda genérico a propósito, sin inventar una causa.
          this.estadoEnvio.set('error');
        },
      });
  }
}
