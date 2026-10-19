import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DATOS_NEGOCIO } from '@core/negocio/datos-negocio';

@Component({
  selector: 'app-pie-pagina',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pie-pagina.html',
  styles: [
    `
      @media (width > 1280px) {
        .pie-pagina {
          position: absolute;
          width: 100%;
          z-index: 49;
        }
      }
    `,
  ],
})
export class PiePagina {
  protected readonly datosNegocio = DATOS_NEGOCIO;
}
