import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconoLT } from '@servicios/datos';

@Component({
  selector: 'lt-icono',
  imports: [FaIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="icono"
       [style.font-size]="fontSize()">
    @if (icono().tipo.substring(0, 2) === 'pi') {
      <span [class]="'pi ' + icono().nombre"></span>
    }
    @if (icono().tipo.substring(0, 2) === 'fa') {
      <fa-icon [icon]="[icono().tipo, icono().nombre]" />
    }
    @if (icono().tipo.substring(0, 2) === 'ma') {
      <span [class]="icono().tipo"
            [style.font-size]="fontSize()"
            [innerHTML]="icono().nombre">
      </span>
    }
  </div>
`,
  styles: [`
    .icono {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `],
})
export class Icono {
  readonly icono = input.required<IconoLT>();
  readonly fontSize = input.required<string>();
}
