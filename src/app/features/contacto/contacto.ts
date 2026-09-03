import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DATOS_NEGOCIO } from '@core/negocio/datos-negocio';
import { environment } from '@environments/environment';
import { MetaService } from '@core/seo/meta.service';
import { JsonLdService } from '@core/seo/json-ld.service';
import { esquemaContactPage, esquemaLocalBusiness, esquemaMigasDePan } from '@core/seo/esquemas';

interface FormularioContacto {
  nombre: FormControl<string>;
  correo: FormControl<string>;
  mensaje: FormControl<string>;
  consentimientoDatos: FormControl<boolean>;
}

type EstadoEnvio = 'inicial' | 'backend-pendiente';

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

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    // POST /api/contacto todavía no existe — es T-7 (docs/TODO.md). Este
    // método solo valida y deja evidencia visible del estado en la propia
    // plantilla; no hay llamada HTTP real hasta que exista el backend.
    this.estadoEnvio.set('backend-pendiente');
  }
}
