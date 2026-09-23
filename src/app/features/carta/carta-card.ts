import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CardCarta } from './armar-carta';
import { idNota, idSeccion } from './carta-ids';
import { normalizarIcono } from './material-symbols';

@Component({
  selector: 'app-carta-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './carta-card.html',
  host: { class: 'block' },
})
export class CartaCard {
  readonly card = input.required<CardCarta>();

  protected readonly id = computed(() => idSeccion(this.card()));
  protected readonly icono = computed(() => normalizarIcono(this.card().icono));

  /** `id` de la nota de una marca, o `null` si la card no la tiene. */
  protected idNotaDe(marca: string): string | null {
    const indice = this.card().notasAlPie.findIndex((n) => n.marca === marca);
    return indice >= 0 ? idNota(this.id(), indice) : null;
  }

  protected idNota(indice: number): string {
    return idNota(this.id(), indice);
  }
}
