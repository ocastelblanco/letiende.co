import { Component, inject, OnInit, ChangeDetectorRef, effect } from '@angular/core';
import { IconosModule } from '@modulos/iconos/iconos-module';
import { CloudinaryModule } from '@cloudinary/ng';
import { CloudinaryImage } from '@cloudinary/url-gen';
import { Cloudinary } from '@cloudinary/url-gen'; // Para inyectar la instancia configurada
import { scale } from '@cloudinary/url-gen/actions/resize';
import { quality } from '@cloudinary/url-gen/actions/delivery';
import { auto as autoQuality } from '@cloudinary/url-gen/qualifiers/quality';
import { format } from '@cloudinary/url-gen/actions/delivery';
import { auto as autoFormat } from '@cloudinary/url-gen/qualifiers/format';
import { PrimengModule } from '@modulos/primeng/primeng-module';
import { FirebaseStorageImage } from '@directivas/firebase-storage-image';
import { LtConfig } from '@servicios/lt-config';

@Component({
  selector: 'lt-inicio',
  imports: [
    IconosModule,
    CloudinaryModule,
    PrimengModule,
    FirebaseStorageImage,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss'
})
export class Inicio implements OnInit {
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef); // Inyectar ChangeDetectorRef para forzar la detección de cambios
  img: CloudinaryImage | undefined; // Objeto de imagen del SDK de Cloudinary

  // Inyectamos la instancia de Cloudinary configurada globalmente
  private cld: Cloudinary = inject(Cloudinary);
  private config: LtConfig = inject(LtConfig);
  modoTema: string = 'light';
  constructor() {
    effect(() => this.modoTema = this.config.modoTema()); // Efecto para reaccionar a cambios en el modo de tema
  }
  async ngOnInit(): Promise<void> {
    try {
      // Lógica para cargar la imagen de Cloudinary usando el SDK.
      // La instancia 'cld' ya viene configurada desde app.config.ts.
      const publicId = 'FotoLT00017_oyw7kc'; // ID de la imagen, incluyendo el folder

      this.img = this.cld.image(publicId)
        .resize(scale().width(750))
        .delivery(quality(autoQuality()))
        .delivery(format(autoFormat()));

      console.log('Cloudinary SDK Image URL:', this.img.toURL()); // Para verificar la URL generada
      this.cdr.detectChanges();
    } catch (error) {
      console.error("Error al obtener la URL del logo:", error);
      // Opcionalmente, puedes asignar una URL de fallback o mostrar un mensaje de error
    }
  }
  cambiarTema(): void {
    const element: HTMLElement = document.querySelector('html') as HTMLElement;
    element.classList.toggle('tema-oscuro');
    this.config.modoTema.set(this.modoTema === 'light' ? 'dark' : 'light'); // Cambiar el modo de tema
  }
}
