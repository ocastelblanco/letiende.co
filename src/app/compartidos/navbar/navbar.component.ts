import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MenuDesplegableComponent } from './menu-desplegable/menu-desplegable.component';
import { ActivatedRoute, NavigationEnd, Router, UrlSegment } from '@angular/router';
import { filter } from 'rxjs';

export interface Vinculo {
  titulo: string;
  vinculo: string;
}

@Component({
  selector: 'lt-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  bpPantalla!: string | undefined;
  anchos = new Map([
    [Breakpoints.XSmall, 'xs'],
    [Breakpoints.Small, 'sm'],
    [Breakpoints.Medium, 'md'],
    [Breakpoints.Large, 'lg'],
    [Breakpoints.XLarge, 'xl'],
  ]);
  vinculos: Vinculo[] = [
    /*{ titulo: 'Inicio', vinculo: 'inicio' },*/
    { titulo: 'Eventos', vinculo: 'eventos' },
    { titulo: 'Menú', vinculo: 'menu' },
  ];
  numVinculo: number = 0;
  constructor(
    private breakpoint: BreakpointObserver,
    private _bottomSheet: MatBottomSheet,
    private router: Router,
    private route: ActivatedRoute
  ) {
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
    this.router.events
      .pipe(filter((ev: any) => ev instanceof NavigationEnd))
      .subscribe((ev: any) =>
        this.route.firstChild?.url
          .subscribe((url: UrlSegment[]) =>
            this.numVinculo = this.vinculos.findIndex((vin: Vinculo) => vin.vinculo == url[0].path)
          )
      );
  }
  abreMenu(): void {
    this._bottomSheet.open(MenuDesplegableComponent, { data: { vinculos: this.vinculos } });
  }
}
