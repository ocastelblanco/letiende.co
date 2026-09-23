import { InjectionToken } from '@angular/core';

export interface ObservadorSecciones {
  observar(elemento: Element): void;
  desconectar(): void;
}

/** Avisa cuando una sección entra (`true`) o sale (`false`) de la franja de lectura. */
export type FabricaObservador = (
  alCambiar: (id: string, visible: boolean) => void,
) => ObservadorSecciones;

/**
 * Inyectable para poder sustituirlo en pruebas. Solo se invoca en el
 * navegador (dentro de `afterNextRender`): nunca toca `IntersectionObserver`
 * en el servidor.
 */
export const FABRICA_OBSERVADOR = new InjectionToken<FabricaObservador>('FABRICA_OBSERVADOR', {
  providedIn: 'root',
  factory: () => (alCambiar) => {
    const observador = new IntersectionObserver(
      (registros) => registros.forEach((r) => alCambiar(r.target.id, r.isIntersecting)),
      // Franja de lectura: bajo la barra (h-16) y hasta el 40 % superior de la pantalla.
      { rootMargin: '-96px 0px -60% 0px' },
    );
    return {
      observar: (elemento) => observador.observe(elemento),
      desconectar: () => observador.disconnect(),
    };
  },
});
