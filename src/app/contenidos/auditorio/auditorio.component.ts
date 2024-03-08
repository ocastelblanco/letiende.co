import { AfterViewInit, Component, OnInit, ViewChild, effect } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DataService } from 'src/app/servicios/data.service';
import { Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatSidenavContainer } from '@angular/material/sidenav';

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
export class AuditorioComponent implements OnInit, AfterViewInit {
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
  subVinculos: { titulo: string, link: string }[] = [
    { titulo: 'Presentación', link: 'presentacion' },
    { titulo: 'Especificaciones', link: 'especificaciones' },
  ];
  constructor(
    private data: DataService,
    private breakpoint: BreakpointObserver,
    private router: Router
  ) {
    effect(() => this.idioma = this.data.idioma());
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
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.sideNavContainer?.scrollable.elementScrolled().subscribe((ev: Event) => {
        console.log(this.sideNavContainer?.scrollable.measureScrollOffset('top'));
      });
    });
  }
  ngOnInit(): void {
    this.data.getInterfaz().subscribe(((interfaz: any) => interfaz.auditorio ? this.interfaz = interfaz.auditorio : null));
  }
  subMenuActivo(subVinculo: string): boolean {
    return subVinculo == this.router.url.split('/')[2];
  }
  abreSubVinculo(link: string): void {
    if (this.bpPantalla == 'xs' || this.bpPantalla == 'sm') this.openDrawer = false;
  }
}
