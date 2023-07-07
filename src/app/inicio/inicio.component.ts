import { Component } from '@angular/core';
import { trigger, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'lt-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss'],
  animations: [
    trigger('easterEgg', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(-4em)'
        }),
        animate('0.2s ease-in-out',
          style({
            opacity: 1,
            transform: 'none'
          })),
      ]),
      transition(':leave', [
        animate('0.2s ease-in-out',
          style({
            opacity: 0,
            transform: 'translateY(-4em)'
          })),
      ]),
    ]),
  ]
})
export class InicioComponent {
  clics: number = 0;
  easterEgg: boolean = false;
  haceClic(): void {
    this.clics++;
    if (this.clics < 5) {
      setTimeout(() => this.clics = 0, 5000);
    } else {
      this.easterEgg = true;
      setTimeout(() => this.easterEgg = false, 10000);
    }
  }
}
