import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MetaService } from '@core/seo/meta.service';
import { JsonLdService } from '@core/seo/json-ld.service';
import { esquemaAboutPage, esquemaMigasDePan } from '@core/seo/esquemas';

@Component({
  selector: 'app-nosotros',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nosotros.html',
})
export class NosotrosComponent {
  private readonly meta = inject(MetaService);
  private readonly jsonLd = inject(JsonLdService);

  constructor() {
    this.meta.actualizar({
      titulo: 'Nosotros - Le Tiende',
      descripcion:
        'Qué es Le Tiende: un centro cultural en Bogotá con teatro, librería y café bar bajo un mismo techo.',
      ruta: '/nosotros',
    });

    this.jsonLd.establecer('ld-pagina', [
      esquemaAboutPage(),
      esquemaMigasDePan([
        { nombre: 'Inicio', ruta: '/' },
        { nombre: 'Nosotros', ruta: '/nosotros' },
      ]),
    ]);
  }
}
