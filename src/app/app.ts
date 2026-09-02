import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BarraNavegacion } from '@shared/navegacion/barra-navegacion';
import { PiePagina } from '@shared/navegacion/pie-pagina';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BarraNavegacion, PiePagina],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {}
