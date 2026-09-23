import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  REQUEST,
  RESPONSE_INIT,
  inject,
} from '@angular/core';
import { CartaService } from '@core/api/carta.service';
import { cartaVisible, resolverHostCarta } from '@core/carta-visibilidad';
import { MetaService } from '@core/seo/meta.service';
import { NoEncontradaComponent } from '@features/no-encontrada/no-encontrada';

@Component({
  selector: 'app-carta',
  imports: [NoEncontradaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './carta.html',
})
export class CartaComponent {
  protected readonly visible: boolean;
  // `resource()` es eager: se inyecta CartaService solo si la carta es
  // visible, para no leer Comandante en una respuesta que será 404.
  protected readonly carta: CartaService['carta'] | null;

  constructor() {
    const request = inject(REQUEST, { optional: true });
    const respuestaInit = inject(RESPONSE_INIT, { optional: true });
    const injector = inject(Injector);
    const meta = inject(MetaService);

    this.visible = cartaVisible(resolverHostCarta(request));

    if (!this.visible) {
      // 404 condicional por petición: no sirve un `status` estático en
      // app.routes.server.ts. Bloqueo editorial, no de seguridad (ADR-024).
      if (respuestaInit) respuestaInit.status = 404;
      this.carta = null;
      return;
    }

    this.carta = injector.get(CartaService).carta;
    meta.actualizar({
      titulo: 'Carta - Le Tiende',
      descripcion: 'Carta del café bar de Le Tiende: bebidas, comidas y sus precios.',
      ruta: '/carta',
    });
  }
}
