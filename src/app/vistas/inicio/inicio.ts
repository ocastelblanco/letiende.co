import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { getDownloadURL, ref, Storage, StorageReference } from '@angular/fire/storage';
import { IconosModule } from '@modulos/iconos/iconos-module';

@Component({
  selector: 'lt-inicio',
  imports: [
    IconosModule
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss'
})
export class Inicio implements OnInit {
  private storage: Storage = inject(Storage);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  urlLogo: string | undefined;

  async ngOnInit(): Promise<void> {
    const iconoRef: StorageReference = ref(this.storage, 'iconos/logo_negro_sin_fondo.svg');
    try {
      this.urlLogo = await getDownloadURL(iconoRef);
      console.log('Obtuve la URL correcta: ' + this.urlLogo);
      this.cdr.detectChanges();
    } catch (error) {
      console.error("Error al obtener la URL del logo:", error);
      // Opcionalmente, puedes asignar una URL de fallback o mostrar un mensaje de error
    }
  }
}
