import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IconosModule } from '@modulos/iconos/iconos-module';
import { IconoLT } from '@servicios/datos';

@Component({
  selector: 'lt-icono',
  imports: [
    NgClass,
    IconosModule,
  ],
  template: `
  <div class="icono"
       [style]="{'font-size': fontSize}">
    @if (icono.tipo.substring(0, 2) == 'pi') {
    <span class="pi"
          [ngClass]="icono.nombre">
    </span>
    }
    @if (icono.tipo.substring(0, 2) == 'fa') {
    <fa-icon [icon]="[icono.tipo, icono.nombre]" />
    }
    @if (icono.tipo.substring(0, 2) == 'ma') {
    <span [ngClass]="icono.tipo"
          [style]="{'font-size': fontSize}"
          [innerHTML]="icono.nombre">
    </span>
    }
  </div>
`,
  styles: [`
    .icono {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `],
})
export class Icono {
  @Input() icono!: IconoLT;
  @Input() fontSize!: string;
}
