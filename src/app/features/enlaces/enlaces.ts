import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { EnlacesService } from '@core/api/enlaces.service';
import { MetaService } from '@core/seo/meta.service';
import { EnlacesArmados } from './armar-enlaces';

/** Los SVG salen del propio origen; la clave es de un conjunto cerrado (armar-enlaces.ts). */
const CARPETA_IMAGENES = '/enlaces';

@Component({
  selector: 'app-enlaces',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './enlaces.html',
})
export class EnlacesComponent {
  private readonly servicio = inject(EnlacesService);

  protected readonly enlaces = computed<EnlacesArmados | null>(() =>
    this.servicio.enlaces.hasValue() ? (this.servicio.enlaces.value() ?? null) : null,
  );

  // Índices de los paneles plegados. Por defecto todos están desplegados.
  private readonly plegados = signal<ReadonlySet<number>>(new Set());

  constructor() {
    inject(MetaService).actualizar({
      titulo: 'Enlaces - Le Tiende',
      descripcion: 'Los enlaces de Le Tiende: el Pódbar en YouTube, Spotify, Apple Podcasts y más.',
      ruta: '/enlaces',
      robots: 'noindex,follow',
    });
  }

  protected desplegado(indice: number): boolean {
    return !this.plegados().has(indice);
  }

  protected alternar(indice: number): void {
    this.plegados.update((actuales) => {
      const siguientes = new Set(actuales);
      if (!siguientes.delete(indice)) siguientes.add(indice);
      return siguientes;
    });
  }

  protected rutaIcono(clave: string): string {
    return `${CARPETA_IMAGENES}/icono-${clave}.svg`;
  }

  protected rutaLogo(clave: string): string {
    return `${CARPETA_IMAGENES}/logo-${clave}.svg`;
  }
}
