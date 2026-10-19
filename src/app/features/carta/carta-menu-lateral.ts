import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/core';
import { FABRICA_OBSERVADOR } from './carta-observador';

export interface EntradaMenuCarta {
  readonly id: string;
  readonly etiqueta: string;
  readonly icono: string;
  readonly destacada: boolean;
}

@Component({
  selector: 'app-carta-menu-lateral',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './carta-menu-lateral.html',
  host: { '(keydown.escape)': 'expandido.set(false)' },
})
export class CartaMenuLateral {
  readonly entradas = input.required<readonly EntradaMenuCarta[]>();

  protected readonly expandido = signal(false);
  protected readonly activaId = signal<string | null>(null);

  private readonly documento = inject(DOCUMENT);
  private readonly fabrica = inject(FABRICA_OBSERVADOR);
  private readonly visibles = new Set<string>();

  constructor() {
    const destruir = inject(DestroyRef);
    // Solo en el navegador: `afterNextRender` no corre en el servidor.
    afterNextRender(() => {
      const observador = this.fabrica((id, visible) => {
        if (visible) this.visibles.add(id);
        else this.visibles.delete(id);
        // La primera sección visible en el orden de la página; si ninguna,
        // se conserva la anterior (entre dos cards no se apaga el menú).
        const primera = this.entradas().find((e) => this.visibles.has(e.id));
        if (primera) this.activaId.set(primera.id);
      });
      for (const entrada of this.entradas()) {
        const elemento = this.documento.getElementById(entrada.id);
        if (elemento) observador.observar(elemento);
      }
      destruir.onDestroy(() => observador.desconectar());
    });
  }

  protected alternar(): void {
    this.expandido.update((v) => !v);
  }

  protected elegir(evento: Event, id: string): void {
    // Sin esto `href="/carta#…"` recargaría la ruta; el ancla queda para quien no tenga JS.
    evento.preventDefault();
    // El desplazamiento suave (o no) lo decide `scroll-behavior` en styles.css,
    // que respeta `prefers-reduced-motion`.
    this.documento.getElementById(id)?.scrollIntoView({ block: 'start' });
    this.activaId.set(id);
    this.expandido.set(false);
  }
}
