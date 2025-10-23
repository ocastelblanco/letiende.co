import { ChangeDetectionStrategy, Component, inject, effect, OnInit, signal } from '@angular/core';
import { ImagenFondo } from '@componentes/imagen-fondo';
import { IconosModule } from '@modulos/iconos/iconos-module';
import { PrimengModule } from '@modulos/primeng/primeng-module';
import { LtConfig } from '@servicios/lt-config';
import { MetaService } from '@servicios/meta';

@Component({
  selector: 'lt-inicio',
  imports: [PrimengModule, IconosModule, ImagenFondo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss'
})
export class Inicio implements OnInit {
  private readonly config: LtConfig = inject(LtConfig);
  private readonly meta: MetaService = inject(MetaService);

  readonly modoTema = signal<string>('light');

  constructor() {
    effect(() => this.modoTema.set(this.config.modoTema())); // Efecto para reaccionar a cambios en el modo de tema
  }

  ngOnInit(): void {
    this.meta.updatePageMeta({
      title: 'Le Tiende - Centro Cultural',
      description: 'Café en taza, literatura en papel y música en surcos de vinilo.',
      keywords: 'café, literatura, música, vinilos, cultura, centro cultural, Le Tiende, auditorio, parkway, Bogotá',
      image: 'https://assets.letiende.co/logos/logo_sobre_amarillo_sin_fondo.png',
      url: 'https://letiende.co',
      type: 'website',
      siteName: 'Le Tiende',
      canonical: 'https://letiende.co/inicio',
      noindex: false,
      nofollow: false,
    });
  }
}
