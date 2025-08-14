import { Component, inject, effect, OnInit } from '@angular/core';
import { ImagenFondo } from '@componentes/imagen-fondo';
import { IconosModule } from '@modulos/iconos/iconos-module';
import { PrimengModule } from '@modulos/primeng/primeng-module';
import { LtConfig } from '@servicios/lt-config';
import { MetaService } from '@servicios/meta';

@Component({
  selector: 'lt-menu',
  imports: [
    PrimengModule,
    IconosModule,
    ImagenFondo,
  ],
  templateUrl: './menu.html',
  styleUrl: './menu.scss'
})
export class Menu implements OnInit {
  private config: LtConfig = inject(LtConfig);
  private meta: MetaService = inject(MetaService);
  modoTema: string = 'light';
  constructor() {
    effect(() => this.modoTema = this.config.modoTema()); // Efecto para reaccionar a cambios en el modo de tema
  }
  ngOnInit(): void {
    this.meta.updatePageMeta({
      title: 'Menú Le Tiende',
      description: 'Disfruta de nuestro menú para acompañar tus mejores momentos en Le Tiende.',
      keywords: 'café, empanadas, hamburquesas, tortas, pastelería, cocteles, licores, Le Tiende, parkway, Bogotá',
      image: 'https://assets.letiende.co/logos/logo_sobre_amarillo_sin_fondo.png',
      url: 'https://letiende.co',
      type: 'website',
      siteName: 'Le Tiende',
      canonical: 'https://letiende.co/menu',
      noindex: false,
      nofollow: false,
    });
  }
}
