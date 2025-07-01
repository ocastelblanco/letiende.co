import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { getDownloadURL, ref, Storage, StorageReference } from '@angular/fire/storage';
import { IconosModule } from '@modulos/iconos/iconos-module';
import { CloudinaryConfig } from '@servicios/cloudinary-config';
import { CloudinaryModule } from '@cloudinary/ng';
import { CloudinaryImage } from '@cloudinary/url-gen';
import { Cloudinary } from '@cloudinary/url-gen'; // Para inyectar la instancia configurada
import { scale } from '@cloudinary/url-gen/actions/resize';
import { quality } from '@cloudinary/url-gen/actions/delivery';
import { auto as autoQuality } from '@cloudinary/url-gen/qualifiers/quality';
import { format } from '@cloudinary/url-gen/actions/delivery';
import { auto as autoFormat } from '@cloudinary/url-gen/qualifiers/format';

@Component({
  selector: 'lt-inicio',
  imports: [
    IconosModule,
    CloudinaryModule,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss'
})
export class Inicio implements OnInit {
  private storage: Storage = inject(Storage);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef); // Inyectar ChangeDetectorRef para forzar la detección de cambios
  urlLogo: string | undefined;
  private cloudinaryConfig: CloudinaryConfig = inject(CloudinaryConfig);
  // cloudinaryImageUrl: string | undefined; // Eliminamos esta propiedad, ahora usaremos el objeto SDK
  img: CloudinaryImage | undefined; // Objeto de imagen del SDK de Cloudinary

  // Inyectamos la instancia de Cloudinary configurada globalmente
  private cld: Cloudinary = inject(Cloudinary);

  async ngOnInit(): Promise<void> {
    const iconoRef: StorageReference = ref(this.storage, 'iconos/logo_negro_sin_fondo.svg');
    try {
      this.urlLogo = await getDownloadURL(iconoRef);
      console.log('Obtuve la URL correcta: ' + this.urlLogo);
      this.cdr.detectChanges(); // Forzar detección de cambios para urlLogo

      // Lógica para cargar la imagen de Cloudinary usando el SDK
      if (this.cloudinaryConfig.cloudName) {
        const publicId = 'FotoLT00017_oyw7kc'; // ID de la imagen, incluyendo el folder

        this.img = this.cld.image(publicId)
          .resize(scale().width(750))
          .delivery(quality(autoQuality()))
          .delivery(format(autoFormat()));

        console.log('Cloudinary SDK Image URL:', this.img.toURL()); // Para verificar la URL generada
        this.cdr.detectChanges();
      } else {
        console.warn('El Cloud Name de Cloudinary no está disponible. No se puede cargar la imagen.');
      }
    } catch (error) {
      console.error("Error al obtener la URL del logo:", error);
      // Opcionalmente, puedes asignar una URL de fallback o mostrar un mensaje de error
    }
  }
}
