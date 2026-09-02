import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Placeholder de las rutas institucionales hasta T-5 (docs/TODO.md).
 * Existe solo para que la barra de navegación tenga algo real a qué apuntar.
 */
@Component({
  selector: 'app-pagina-pendiente',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagina-pendiente.html',
})
export class PaginaPendiente {}
