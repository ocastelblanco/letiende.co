import { Component, inject, effect } from '@angular/core';
import { ImagenFondo } from '@componentes/imagen-fondo';
import { IconosModule } from '@modulos/iconos/iconos-module';
import { PrimengModule } from '@modulos/primeng/primeng-module';
import { LtConfig } from '@servicios/lt-config';

@Component({
  selector: 'lt-inicio',
  imports: [
    PrimengModule,
    IconosModule,
    ImagenFondo,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss'
})
export class Inicio {
  private config: LtConfig = inject(LtConfig);
  modoTema: string = 'light';
  constructor() {
    effect(() => this.modoTema = this.config.modoTema()); // Efecto para reaccionar a cambios en el modo de tema
  }
}
