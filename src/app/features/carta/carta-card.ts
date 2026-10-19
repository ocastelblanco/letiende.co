import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CardCarta } from './armar-carta';
import { idSeccion } from './carta-ids';
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
}
