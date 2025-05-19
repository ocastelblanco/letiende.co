import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { OnDestroy, Component, effect, ElementRef, Input, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { DataService, ElementoAuditorio } from 'src/app/servicios/data.service';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'lt-paneles',
  templateUrl: './paneles.component.html',
  styleUrl: './paneles.component.scss',
})
export class PanelesComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() paneles: ElementoAuditorio[] = [
    {
      imagen: 'https://www.mediatekis.com.co/media/catalog/product/cache/7c37608a0ced941863e2dadf4d54b13d/x/2/x2222usb_3.jpg',
      titulo: {
        'es': 'Consola',
        'en': 'Mixer',
      },
      descripcion: {
        'es': '<p><strong>Modelo</strong>: XENYX X2222USB</p>',
        'en': '<p><strong>Model</strong>: XENYX X2222USB</p>',
      },
      link: 'https://www.behringer.com/product.html?modelCode=0601-ADA'
    },
    {
      imagen: 'https://superaudio.com.co/wp-content/uploads/2024/10/B215D-BEHRINGER-CABINAACTIVA-3-1.jpg',
      titulo: {
        'es': 'Parlantes activos',
        'en': 'Active loudspeakers',
      },
      descripcion: {
        'es': '<p><strong>Modelo</strong>: EUROLIVE B215D</p>',
        'en': '<p><strong>Model</strong>: EUROLIVE B215D</p>',
      },
      link: 'https://www.behringer.com/product.html?modelCode=0313-ADG'
    },
    {
      imagen: 'https://live.staticflickr.com/7167/6770113909_07430e9b44_c_d.jpg',
      titulo: {
        'es': 'Tarima',
        'en': 'Platform',
      },
      descripcion: {
        'es': '<p><strong>Tamaño</strong>: 16m<sup>2</sup></p>',
        'en': '<p><strong>Size</strong>: 16m<sup>2</sup></p>',
      }
    },
    {
      imagen: 'https://http2.mlstatic.com/D_NQ_NP_617714-MLU70014306246_062023-O.webp',
      titulo: {
        'es': 'Micrófonos',
        'en': 'Microphones',
      },
      descripcion: {
        'es': '<p><strong>Model</strong>: Ultravoice</p>',
        'en': '',
      },
      link: 'https://www.behringer.com/series.html?category=R-BEHRINGER-ULTRAVOICESERIES'
    },
    {
      imagen: 'https://groupesebcol.vtexassets.com/arquivos/ids/169621/5861033768-1.jpg.jpg?v=638749848624270000&width=800&height=800&aspect=true-800-800',
      titulo: {
        'es': 'Ventiladores de pedestal',
        'en': 'Pedestal fan',
      },
      descripcion: {
        'es': '<p><strong>Cantidad:</strong> 3</p>',
        'en': '<p><strong>Number:</strong> 3</p>',
      },
      link: 'https://www.imusa.com.co/ventilador-pedestal-samurai-air-power-negro/p'
    },
    {
      imagen: 'https://live.staticflickr.com/1193/1332993997_d1735a9968_c_d.jpg',
      titulo: {
        'es': 'Asilamiento acústico',
        'en': 'Acustic insulation',
      },
      descripcion: {
        'es': '<p>Aislamiento acústico en las paredes, para evitar que ingrese sonido al auditorio.</p>',
        'en': '<p>Acoustic insulation on the walls, to prevent sound from entering the auditorium.</p>',
      },
    },
  ];
  idioma: string = 'es';
  verMas?: { [key: string]: string };
  hayInterfaz: boolean = false;
  rowHeight: string = '4:3';
  cols: number = 3;
  panelesAbiertos: boolean[] = [];
  destroyed = new Subject<void>();
  currentScreenSize: string = '';
  displayNameMap = new Map([
    [Breakpoints.XSmall, 'XSmall'],
    [Breakpoints.Small, 'Small'],
    [Breakpoints.Medium, 'Medium'],
    [Breakpoints.Large, 'Large'],
    [Breakpoints.XLarge, 'XLarge'],
  ]);
  constructor(
    private data: DataService,
    private el: ElementRef<HTMLElement>,
    private breakpointObserver: BreakpointObserver,
    private ngZone: NgZone,
  ) {
    effect(() => this.idioma = this.data.idioma());
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
      ])
      .pipe(takeUntil(this.destroyed))
      .subscribe(result => {
        for (const query of Object.keys(result.breakpoints)) {
          if (result.breakpoints[query]) {
            this.currentScreenSize = this.displayNameMap.get(query) ?? 'Unknown';
            this.ajustaTamano();
          }
        }
      });
  }
  ngOnInit(): void {
    this.panelesAbiertos = this.paneles.map((p: ElementoAuditorio, i: number) => false);
    this.data.getInterfaz().subscribe((interfaz: any) => this.verMas = interfaz.auditorio.generales.verMas);
  }
  ngAfterViewInit(): void {
    setTimeout(() => this.ajustaTamano(), 50);
    this.ngZone.runOutsideAngular(() => {
      fromEvent(window, 'resize')
        .pipe(takeUntil(this.destroyed))
        .subscribe(() => {
          this.ajustaTamano();
        });
    });
  }
  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }
  ajustaTamano(): void {
    const paneles: HTMLElement = this.el.nativeElement;
    const ancho: number = paneles.offsetWidth;
    const alto: number = paneles.offsetHeight;
    if (ancho > 0 && alto > 0) {
      switch (this.currentScreenSize) {
        case 'XSmall':
          this.cols = 1;
          break;
        case 'Small':
          this.cols = 1;
          break;
        case 'Medium':
          this.cols = 2;
          break;
        case 'Large':
          this.cols = 3;
          break;
        case 'XLarge':
          this.cols = 4;
          break;
        default:
          this.cols = 3;
          this.rowHeight = '4:3';
      }
      const numFilas: number = Math.ceil(this.paneles.length / this.cols);
      const altoFila: number = Math.floor((alto / numFilas) - 20);
      this.rowHeight = `${altoFila}px`;
    }
  }
  togglePanel(ev: Event, numPanel: number): void {
    this.panelesAbiertos[numPanel] = !this.panelesAbiertos[numPanel];
    const panel: HTMLElement = (ev.target as HTMLElement).parentElement?.parentElement?.parentElement?.parentElement as HTMLElement;
    panel.classList.toggle('abierto');
  }
}
