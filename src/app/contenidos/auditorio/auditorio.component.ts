import { Component, NgZone, OnInit, ViewChild, effect } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Auditorio, DataService } from 'src/app/servicios/data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatSidenavContainer } from '@angular/material/sidenav';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { animationFrameScheduler } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CotizacionComponent } from './cotizacion/cotizacion.component';

interface SubVinculo {
  titulo: string;
  link: string;
  icono?: string;
  offsetTop: number;
  offsetBottom: number;
}

@Component({
  selector: 'lt-auditorio',
  templateUrl: './auditorio.component.html',
  styleUrl: './auditorio.component.scss',
  animations: [
    trigger('abreSubnav', [
      transition(':enter',
        [
          style({
            opacity: 0,
            transform: 'translateX(-100%)'
          }),
          animate('500ms ease-in', style({
            opacity: 1,
            transform: 'translateX(0)'
          }))
        ]),
      transition(':leave', [
        animate('500ms ease-out', style({
          opacity: 0,
          transform: 'translate(-100%)'
        }))
      ])
    ])
  ]
})
export class AuditorioComponent implements OnInit {
  @ViewChild("sidenavContainer", { static: false }) sideNavContainer?: MatSidenavContainer;
  idioma: string = 'es';
  interfaz: any;
  bpPantalla!: string | undefined;
  anchos = new Map([
    [Breakpoints.XSmall, 'xs'],
    [Breakpoints.Small, 'sm'],
    [Breakpoints.Medium, 'md'],
    [Breakpoints.Large, 'lg'],
    [Breakpoints.XLarge, 'xl'],
  ]);
  modoDrawer: 'over' | 'push' | 'side' = 'side';
  openDrawer: boolean = true;
  subVinculos: SubVinculo[] = [
    { titulo: 'Nuestro auditorio', link: 'auditorio', icono: 'theater_comedy', offsetTop: 0, offsetBottom: 0 },
    { titulo: 'Especificaciones', link: 'especificaciones', icono: 'settings_input_component', offsetTop: 0, offsetBottom: 0 },
    { titulo: 'Eventos', link: 'eventos', icono: 'local_activity', offsetTop: 0, offsetBottom: 0 },
  ];
  subPos: number[] = [];
  dataAuditorio: Auditorio | undefined;
  constructor(
    private data: DataService,
    private breakpoint: BreakpointObserver,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    public dialog: MatDialog,
  ) {
    effect(() => {
      this.idioma = this.data.idioma();
      this.titulaSubVinculos();
    });
    this.breakpoint
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
      ])
      .subscribe(result => {
        for (const tam of Object.keys(result.breakpoints)) if (result.breakpoints[tam]) {
          this.bpPantalla = this.anchos.get(tam);
          switch (this.bpPantalla) {
            case 'xs':
              this.modoDrawer = 'over';
              this.openDrawer = false;
              break;
            case 'sm':
              this.modoDrawer = 'push';
              this.openDrawer = false;
              break;
            default:
              this.modoDrawer = 'side';
              this.openDrawer = true;
          }
        }
      });
  }
  ngOnInit(): void {
    this.data.getInterfaz().subscribe((interfaz: any) => {
      interfaz.auditorio ? this.interfaz = interfaz.auditorio : null;
      this.titulaSubVinculos();
      this.calculaOffset();
    });
    this.data.getAuditorio().subscribe((auditorio: Auditorio | undefined) => {
      this.dataAuditorio = auditorio;
      const int = setInterval(() => {
        if (this.sideNavContainer) {
          clearInterval(int);
          this.iniciaMedidaScroll();
        }
      });
    });
  }
  iniciaMedidaScroll(): void {
    //const cont: HTMLElement = this.sideNavContainer?.scrollable.getElementRef().nativeElement as HTMLElement;
    this.calculaOffset();
    this.abreSubVinculo(this.subVinculos.findIndex((v: SubVinculo) => v.link == this.router.url.split('/')[2]));
    this.sideNavContainer?.scrollable.elementScrolled().subscribe((ev: Event) => {
      const pos: number = this.sideNavContainer?.scrollable.measureScrollOffset('top') as number;
      this.ngZone.run(() => {
        const dest: number = this.subVinculos.findIndex((s: SubVinculo) => pos >= s.offsetTop && pos < s.offsetBottom);
        this.navegaA(dest);
      });
    });
  }
  calculaOffset(): void {
    this.subVinculos.forEach((sub: SubVinculo, i: number) => {
      sub.offsetTop = document.getElementById('auditorio-' + sub.link)?.offsetTop as number;
      sub.offsetBottom = i == (this.subVinculos.length - 1) ?
        document.getElementById('auditorio-' + sub.link)?.offsetHeight as number + sub.offsetTop :
        document.getElementById('auditorio-' + this.subVinculos[i + 1].link)?.offsetTop as number
    });
  }
  navegaA(i: number): void {
    this.router.navigate(['..', this.subVinculos[i].link], { relativeTo: this.route, skipLocationChange: false });
  }
  titulaSubVinculos(): void {
    if (this.interfaz) {
      this.subVinculos.forEach((sv: SubVinculo) => sv.titulo = this.interfaz.subVinculos[sv.link][this.idioma]);
      this.openDrawer = false;
      setTimeout(() => this.openDrawer = true);
    }
  }
  subMenuActivo(subVinculo: string): boolean {
    return subVinculo == this.router.url.split('/')[2];
  }
  abreSubVinculo(num: number): void {
    if (this.bpPantalla == 'xs' || this.bpPantalla == 'sm') this.openDrawer = false;
    //this.sideNavContainer?.scrollable.scrollTo({ top: this.subVinculos[num].offsetTop });
    this.animaScroll(this.subVinculos[num].offsetTop);
  }
  animaScroll(destino: number): Promise<void> {
    // Adaptado de https://github.com/angular/components/issues/13613
    return new Promise(resolve => {
      const scrollable: CdkScrollable = this.sideNavContainer?.scrollable as CdkScrollable;
      const origen: number = scrollable.measureScrollOffset('top') as number;
      let pos: number = origen;
      let actual: number = 0;
      const incremento: number = 20;
      const duracion: number = 500;
      const animacion = () => {
        actual += incremento;
        pos = this.easeInOutQuad(actual, origen, destino - origen, duracion);
        scrollable.scrollTo({ top: pos });
        if (actual < duracion) {
          animationFrameScheduler.schedule(animacion);
        } else {
          resolve();
        }
      };
      animacion();
    });
  }
  easeInOutQuad(t: number, b: number, c: number, d: number): number {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  }
  abreCotizacion(): void {
    const dialogRef = this.dialog.open(CotizacionComponent);
  }
}