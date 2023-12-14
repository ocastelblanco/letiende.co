import { Component, OnInit, effect } from '@angular/core';
import { Subscription } from 'rxjs';
import { DataService, Disco, PortadaDisco } from 'src/app/servicios/data.service';
import {
  IconDefinition,
  faRecordVinyl,
  faGuitar,
  faGauge,
  faSackDollar,
  faMapLocation,
  faCalendarDay,
  faMusic,
  faListCheck,
  faArrowDownAZ,
  faArrowDownZA,
  faArrowDown19,
  faArrowDown91
} from '@fortawesome/free-solid-svg-icons';
import { formatCurrency } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'lt-discos',
  templateUrl: './discos.component.html',
  styleUrls: ['./discos.component.scss']
})
export class DiscosComponent implements OnInit {
  discos: Disco[] = [];
  album: IconDefinition = faRecordVinyl;
  artista: IconDefinition = faGuitar;
  estado: IconDefinition = faGauge;
  valor: IconDefinition = faSackDollar;
  origen: IconDefinition = faMapLocation;
  anno: IconDefinition = faCalendarDay;
  genero: IconDefinition = faMusic;
  descripcion: IconDefinition = faListCheck;
  artistaA: IconDefinition = faArrowDownAZ;
  artistaD: IconDefinition = faArrowDownZA;
  preciosA: IconDefinition = faArrowDown19;
  preciosD: IconDefinition = faArrowDown91;
  idioma: string = 'es';
  interfaz: any;
  orden: 'artistas-a' | 'artistas-d' | 'precios-a' | 'precios-d' = 'artistas-a';
  filtros: any = {
    artistas: [],
    estados: [],
    rangoPrecios: {
      minimo: 0,
      maximo: 0
    },
    generos: []
  };
  listados: any = {
    artistas: [],
    estados: [],
    rangoPrecios: {
      minimo: 0,
      maximo: 0
    },
    generos: []
  };
  selectores: any = {
    artistas: [],
    estados: [],
    generos: []
  }
  bpPantalla!: string | undefined;
  anchos = new Map([
    [Breakpoints.XSmall, 'xs'],
    [Breakpoints.Small, 'sm'],
    [Breakpoints.Medium, 'md'],
    [Breakpoints.Large, 'lg'],
    [Breakpoints.XLarge, 'xl'],
  ]);
  constructor(private data: DataService, private breakpoint: BreakpointObserver) {
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
        for (const tam of Object.keys(result.breakpoints)) if (result.breakpoints[tam]) this.bpPantalla = this.anchos.get(tam);
      });
  }
  ngOnInit(): void {
    this.data.getInterfaz().subscribe(((interfaz: any) => interfaz.discos ? this.interfaz = interfaz.discos : null));
    const _getPortadas: Subscription = this.data.getPortadas().subscribe((portadas: PortadaDisco[]) => {
      if (portadas.length > 0) {
        _getPortadas.unsubscribe();
        const _getDiscos: Subscription = this.data.getDiscos().subscribe((_discos: Disco[]) => {
          if (_discos.length > 0) {
            _getDiscos.unsubscribe();
            this.discos = _discos;
            this.discos.sort((a: Disco, b: Disco) => this.ordena(a.artista, b.artista));
            this.listados.artistas = this.generaListado('artista');
            this.listados.estados = this.generaListado('estado');
            this.listados.rangoPrecios = {
              minimo: this.discos.map((d: Disco) => d.valor).sort((a: number, b: number) => this.ordena(a, b)).shift() ?? 0,
              maximo: this.discos.map((d: Disco) => d.valor).sort((a: number, b: number) => this.ordena(a, b)).pop() ?? 0,
            };
            this.filtros.rangoPrecios = JSON.parse(JSON.stringify(this.listados.rangoPrecios));
            this.discos.forEach((disco: Disco) => {
              this.data.getDiscoInfo(disco.album, disco.artista, disco.barcode.substring(0, 3) != 'LTD' ? disco.barcode : null)
                .subscribe((resp: any) => {
                  const formato: any = resp.formats ?
                    resp.formats.find((frm: any) => frm.name == 'Vinyl') :
                    { qty: '1 LP', descriptions: [] };
                  const descripcion: string = formato.qty + ' ' + formato.descriptions.join(', ');
                  const _portada: PortadaDisco | undefined = portadas.find((portada: PortadaDisco) => disco.barcode == portada.barcode);
                  disco.origen = resp.country;
                  disco.anno = resp.year;
                  disco.genero = resp.genre;
                  disco.cover = _portada ? _portada.cover : undefined;
                  disco.descripcion = descripcion;
                  this.listados.generos = this.generaListado('genero');
                  if (!_portada) {
                    let extension: string = resp.cover_image.substring(resp.cover_image.lastIndexOf('.') + 1);
                    extension = extension == 'jpeg' ? 'jpg' : extension;
                    const archivo: string = disco.barcode + '.' + extension;
                    const putPortada: Subscription = this.data.putPortada(archivo, resp.cover_image).subscribe((url: string) => {
                      if (url != '') {
                        disco.cover = url;
                        putPortada.unsubscribe();
                      }
                    });
                  }
                });
            });
          }
        });
      }
    });
  }
  generaListado(campo: string): string[] {
    const salida: string[] = [];
    this.discos
      .filter((disco: Disco) => disco.visible)
      .map((disco: Disco) => {
        const _disco: any = disco;
        return _disco[campo];
      })
      .forEach((elemento: any) => {
        if (elemento && typeof elemento == 'object') {
          elemento.forEach((genero: string) => {
            if (!salida.includes(genero)) salida.push(genero);
          });
        }
        if (elemento && typeof elemento == 'string' && !salida.includes(elemento)) salida.push(elemento);
      });
    return salida.sort((a: string, b: string) => this.ordena(a, b));
  }
  ordena(a: any, b: any): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }
  cambiaFiltro(campo: string, esChip: boolean = false, valor: string = ''): void {
    if (esChip) {
      const pos: number = this.filtros[campo].indexOf(valor);
      if (pos > -1) this.filtros[campo].splice(pos, 1);
      this.selectores[campo] = [];
      setTimeout(() => this.selectores[campo] = this.filtros[campo]);
    } else {
      this.filtros[campo] = this.selectores[campo];
    }
  }
  filtraDiscos(): Disco[] {
    return this.discos
      .filter((disco: Disco) => disco.visible)
      .filter((disco: Disco) => this.filtros.artistas.length && !this.filtros.artistas.includes(disco.artista) ? false : true)
      .filter((disco: Disco) => this.filtros.estados.length && !this.filtros.estados.includes(disco.estado) ? false : true)
      .filter((disco: Disco) => this.filtros.generos.length && this.filtros.generos
        .filter((g: string) => disco.genero?.includes(g)).length < 1 ?
        false : true)
      .filter((disco: Disco) => disco.valor < this.filtros.rangoPrecios.minimo || disco.valor > this.filtros.rangoPrecios.maximo ? false : true);
  }
  aCOP(num: number): string {
    return formatCurrency(num, 'es-CO', '$', 'COP', '3.0');
  }
  cambiaRangoPrecios(pos: 0 | 1, valor: number): void {
    if (pos == 0) this.filtros.rangoPrecios.minimo = valor;
    if (pos == 1) this.filtros.rangoPrecios.maximo = valor;
  }
  cambiaOrden(): void {
    switch (this.orden) {
      case 'artistas-a':
        this.discos.sort((a: Disco, b: Disco) => this.ordena(a.artista, b.artista));
        break;
      case 'artistas-d':
        this.discos.sort((a: Disco, b: Disco) => this.ordena(b.artista, a.artista));
        break;
      case 'precios-a':
        this.discos.sort((a: Disco, b: Disco) => this.ordena(a.valor, b.valor));
        break;
      case 'precios-d':
        this.discos.sort((a: Disco, b: Disco) => this.ordena(b.valor, a.valor));
        break;
    }
  }
}
