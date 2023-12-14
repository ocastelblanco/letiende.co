import { Component, effect } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MenuDesplegableComponent } from './menu-desplegable/menu-desplegable.component';
import { ActivatedRoute, NavigationEnd, Router, UrlSegment } from '@angular/router';
import { filter } from 'rxjs';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { DataService } from 'src/app/servicios/data.service';
import { environment } from 'src/environments/environment';

export interface Vinculo {
  vinculo: string;
  lang: any;
}

@Component({
  selector: 'lt-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  enDesarrollo: string[] = environment.enDesarrollo;
  bpPantalla!: string | undefined;
  anchos = new Map([
    [Breakpoints.XSmall, 'xs'],
    [Breakpoints.Small, 'sm'],
    [Breakpoints.Medium, 'md'],
    [Breakpoints.Large, 'lg'],
    [Breakpoints.XLarge, 'xl'],
  ]);
  bandera: string = 'flag-co';
  idioma: string = 'es';
  vinculos: Vinculo[] = [
    { vinculo: 'eventos', lang: { 'es': 'Eventos', 'en': 'Events' } },
    { vinculo: 'menu', lang: { 'es': 'Menú', 'en': 'Menu' } },
    { vinculo: 'discos', lang: { 'es': 'Discos', 'en': 'Records' } },
  ];
  numVinculo: number = 0;
  constructor(
    private breakpoint: BreakpointObserver,
    private _bottomSheet: MatBottomSheet,
    private router: Router,
    private route: ActivatedRoute,
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    private data: DataService
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
    this.iconRegistry.addSvgIcon('flag-co', this.sanitizer.bypassSecurityTrustResourceUrl('assets/imgs/flags/co.svg'));
    this.iconRegistry.addSvgIcon('flag-gb', this.sanitizer.bypassSecurityTrustResourceUrl('assets/imgs/flags/gb.svg'));
    effect(() => this.idioma = this.data.idioma());
    this.data.getInterfaz().subscribe(((interfaz: any) => {
      interfaz.navbar ?
        this.vinculos = interfaz.navbar :
        null;
      this.router.url.length > 1 ?
        this.numVinculo = this.vinculos.findIndex((vin: Vinculo) => vin.vinculo == this.router.url.substring(1)) :
        null;
    }));
  }
  abreMenu(): void {
    this._bottomSheet.open(MenuDesplegableComponent, {
      data: {
        vinculos: this.vinculos.filter((vinculo: Vinculo) => !this.enDesarrollo.includes(vinculo.vinculo)),
        idioma: this.idioma
      }
    });
  }
  cambiaIdioma(idioma: string): void {
    switch (idioma) {
      case 'es':
        this.bandera = 'flag-co';
        break;
      case 'en':
        this.bandera = 'flag-gb';
        break;
      default:
        this.bandera = 'flag-co';
    }
    this.data.idioma.set(idioma);
  }
}