import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DATOS_NEGOCIO } from '@core/negocio/datos-negocio';

@Component({
  selector: 'app-pie-pagina',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pie-pagina.html',
})
export class PiePagina {
  protected readonly datosNegocio = DATOS_NEGOCIO;
}
