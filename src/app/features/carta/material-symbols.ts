import { DOCUMENT, Injectable, inject } from '@angular/core';

/** Ícono de respaldo cuando el nombre falta o no es válido (ADR-025). */
export const ICONO_RESPALDO = 'restaurant_menu';

/** Íconos fijos de la interfaz de la carta (DESIGN.md §11.4). */
export const ICONOS_FIJOS: readonly string[] = ['chevron_left', 'chevron_right', ICONO_RESPALDO];

/**
 * Los nombres vienen de una hoja editable por terceros y terminan en una URL
 * de `<head>`: solo se aceptan minúsculas, dígitos y guion bajo (A03).
 */
const NOMBRE_VALIDO = /^[a-z0-9_]+$/;

const URL_BASE = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&icon_names=';

/** Devuelve el nombre si es válido; si no, el ícono de respaldo. */
export function normalizarIcono(nombre: string | null | undefined): string {
  return nombre && NOMBRE_VALIDO.test(nombre) ? nombre : ICONO_RESPALDO;
}

/**
 * URL de la hoja de estilos de Material Symbols con solo los íconos usados:
 * únicos, válidos, en orden alfabético (lo exige `icon_names`) y con los
 * fijos de la interfaz siempre incluidos.
 */
export function urlMaterialSymbols(iconos: Iterable<string | null | undefined>): string {
  const nombres = new Set<string>(ICONOS_FIJOS);
  for (const icono of iconos) nombres.add(normalizarIcono(icono));
  const lista = [...nombres].sort().map(encodeURIComponent).join(',');
  return `${URL_BASE}${lista}&display=block`;
}

const ID_ENLACE = 'carta-material-symbols';

/**
 * Agrega y quita el `<link>` de Material Symbols en `<head>`. Solo lo usa
 * `/carta`: el resto del sitio no descarga esa fuente (ADR-025). Mismo patrón
 * que `JsonLdService`: un elemento por `id`, reutilizado si ya existe (el que
 * armó el SSR).
 */
@Injectable({ providedIn: 'root' })
export class MaterialSymbolsService {
  private readonly documento = inject(DOCUMENT);

  establecer(iconos: Iterable<string | null | undefined>): void {
    let enlace = this.documento.getElementById(ID_ENLACE) as HTMLLinkElement | null;
    if (!enlace) {
      enlace = this.documento.createElement('link');
      enlace.id = ID_ENLACE;
      enlace.setAttribute('rel', 'stylesheet');
      this.documento.head.appendChild(enlace);
    }
    enlace.setAttribute('href', urlMaterialSymbols(iconos));
  }

  quitar(): void {
    this.documento.getElementById(ID_ENLACE)?.remove();
  }
}
