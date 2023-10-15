import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'lt-muertos',
  templateUrl: './muertos.component.html',
  styleUrls: ['./muertos.component.scss']
})
export class MuertosComponent {
  calaquitas: Array<string[]> = [this.listaRandom(6, 6), this.listaRandom(12, 6), this.listaRandom(16, 6)];
  flores: Array<string[]> = [this.listaRandom(6, 2), this.listaRandom(12, 2), this.listaRandom(16, 2)];
  velas: Array<string[]> = [this.listaRandom(5, 2), this.listaRandom(11, 2), this.listaRandom(15, 2)];
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
}
