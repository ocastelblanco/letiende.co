import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { trigger, state, stagger, query, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'lt-muertos',
  templateUrl: './muertos.component.html',
  styleUrls: ['./muertos.component.scss'],
  animations: [
    trigger('picado', [
      state('oculto', style({ opacity: 0, transform: 'translateY(-100%)' })),
      state('visible', style({ opacity: 1, transform: 'none' })),
      transition('oculto <=> visible', animate('1s 500ms cubic-bezier(0.35, 0, 0.25, 1)'))
    ]),
    trigger('calaquitas', [
      transition(':enter', [
        query('.calaquita', [
          style({ opacity: 0, transform: 'translateX(-100%)' }),
          stagger(50, [
            animate('70ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'none' }))
          ])
        ])
      ])
    ]),
    trigger('flores', [
      transition(':enter', [
        query('.flor', [
          style({ opacity: 0, transform: 'translateX(100px)' }),
          stagger(50, [
            animate('70ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'none' }))
          ])
        ])
      ])
    ]),
    trigger('velas', [
      transition(':enter', [
        query('.vela', [
          style({ opacity: 0, transform: 'translateY(100px)' }),
          stagger(50, [
            animate('70ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'none' }))
          ])
        ])
      ])
    ]),
    trigger('fotos', [
      transition(':enter', [
        query('.foto', [
          style({ opacity: 0, transform: 'translateX(-100px)' }),
          stagger(500, [
            animate('750ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'none' }))
          ])
        ])
      ])
    ]),
    trigger('comidas', [
      transition(':enter', [
        query('.comida', [
          style({ opacity: 0, transform: 'translateX(100px)' }),
          stagger(500, [
            animate('750ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'none' }))
          ])
        ])
      ])
    ]),
    trigger('pasos', [
      transition(':enter', [
        query('.paso', [
          style({ opacity: 0, transform: 'translateY(-100px)' }),
          stagger(500, [
            animate('750ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'none' }))
          ])
        ])
      ])
    ]),
  ]
})
export class MuertosComponent {
  calaquitas: Array<string[]> = [this.listaRandom(6, 6), this.listaRandom(12, 6), this.listaRandom(16, 6)];
  flores: Array<string[]> = [this.listaRandom(6, 2), this.listaRandom(12, 2), this.listaRandom(16, 2)];
  velas: Array<string[]> = [this.listaRandom(5, 2), this.listaRandom(11, 2), this.listaRandom(15, 2)];
  textosVisibles: boolean = false;
  animaPicados: string[] = ['oculto', 'oculto', 'oculto'];
  animaCalaquitas: boolean[] = [false, false, false];
  animaFlores: boolean[] = [false, false, false];
  animaVelas: boolean[] = [false, false, false];
  animaFotos: boolean = false;
  animaComidas: boolean = false;
  bpPantalla!: string | undefined;
  anchos = new Map([
    [Breakpoints.XSmall, 'xs'],
    [Breakpoints.Small, 'sm'],
    [Breakpoints.Medium, 'md'],
    [Breakpoints.Large, 'lg'],
    [Breakpoints.XLarge, 'xl'],
  ]);
  constructor(private breakpoint: BreakpointObserver) {
    this.breakpoint
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
      ])
      .subscribe(result => {
        for (const tam of Object.keys(result.breakpoints)) if (result.breakpoints[tam]) this.bpPantalla = this.anchos.get(tam);
      });
  }
  listaRandom(cant: number, top: number): string[] {
    const salida: string[] = [];
    for (let i: number = 0; i < cant; i++) salida.push(this.random(1, top));
    return salida;
  }
  random(start: number = 0, end: number): string {
    return "" + (Math.floor(Math.random() * (end - start + 1)) + start);
  }
  finalizaAnimacion(elemento: string, event: any): void {
    switch (elemento) {
      case 'picado0':
        if (event.fromState == 'void') this.animaPicados[0] = 'visible';
        if (event.fromState == 'oculto') this.animaPicados[1] = 'visible';
        break;
      case 'picado1':
        if (event.fromState == 'oculto') this.animaPicados[2] = 'visible';
        break;
      case 'picado2':
        if (event.fromState == 'oculto') this.animaCalaquitas[0] = true;
        break;
      case 'calaquitas0':
        this.animaCalaquitas[1] = true;
        break;
      case 'calaquitas1':
        this.animaCalaquitas[2] = true;
        break;
      case 'calaquitas2':
        this.animaFlores[0] = true;
        break;
      case 'flores0':
        this.animaFlores[1] = true;
        break;
      case 'flores1':
        this.animaFlores[2] = true;
        break;
      case 'flores2':
        this.animaVelas[0] = true;
        break;
      case 'velas0':
        this.animaVelas[1] = true;
        break;
      case 'velas1':
        this.animaVelas[2] = true;
        break;
      case 'velas2':
        this.animaFotos = true;
        break;
      case 'fotos':
        this.animaComidas = true;
        break;
      case 'comidas':
        window.scrollTo({ top: 800, behavior: 'smooth' })
        this.textosVisibles = true;
        break;
      default:
        break;
    }
  }
}
