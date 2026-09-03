import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOMINIO } from './dominio';

export interface DatosMeta {
  /** Título completo de la pestaña, ya con el sufijo "- Le Tiende" si aplica. */
  readonly titulo: string;
  readonly descripcion: string;
  /** Ruta relativa, p.ej. '/', '/nosotros', '/contacto'. */
  readonly ruta: string;
  /** Ruta relativa a una imagen en public/. Por defecto, el ícono de marca. */
  readonly imagen?: string;
}

// No hay imágenes propias por sección todavía (fotos del espacio, del
// catálogo, etc.) — son un activo de diseño que no existe en el repositorio,
// no algo que se pueda inventar aquí. Mientras tanto, todas las páginas
// comparten el ícono de marca real como imagen de Open Graph/Twitter.
const IMAGEN_POR_DEFECTO = '/icon-512.png';

/**
 * Único punto que arma title, meta description, canónica, Open Graph y
 * Twitter Card de una página (tech-specs.md §4.5, PRD §8). Cada componente
 * de página la llama una vez, con datos propios — nunca se comparte el
 * mismo texto entre rutas distintas.
 */
@Injectable({ providedIn: 'root' })
export class MetaService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly documento = inject(DOCUMENT);

  actualizar(datos: DatosMeta): void {
    const urlCanonica = `${DOMINIO}${datos.ruta}`;
    const imagenAbsoluta = `${DOMINIO}${datos.imagen ?? IMAGEN_POR_DEFECTO}`;

    this.title.setTitle(datos.titulo);
    this.meta.updateTag({ name: 'description', content: datos.descripcion });
    this.establecerCanonica(urlCanonica);

    this.meta.updateTag({ property: 'og:title', content: datos.titulo });
    this.meta.updateTag({ property: 'og:description', content: datos.descripcion });
    this.meta.updateTag({ property: 'og:url', content: urlCanonica });
    this.meta.updateTag({ property: 'og:image', content: imagenAbsoluta });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:locale', content: 'es_CO' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: datos.titulo });
    this.meta.updateTag({ name: 'twitter:description', content: datos.descripcion });
    this.meta.updateTag({ name: 'twitter:image', content: imagenAbsoluta });
  }

  private establecerCanonica(url: string): void {
    let enlace = this.documento.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!enlace) {
      enlace = this.documento.createElement('link');
      enlace.setAttribute('rel', 'canonical');
      this.documento.head.appendChild(enlace);
    }
    enlace.setAttribute('href', url);
  }
}
