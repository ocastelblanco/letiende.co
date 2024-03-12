import { Component, OnInit, effect } from '@angular/core';
import { DataService, Libro } from 'src/app/servicios/data.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Dialog } from '@angular/cdk/dialog';
import { FichaLibroComponent } from './ficha-libro/ficha-libro.component';
import { formatCurrency } from '@angular/common';
import {
  IconDefinition,
  faBook,
  faPenNib,
  faArrowDownAZ,
  faArrowDownZA,
  faArrowDown19,
  faArrowDown91
} from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';

interface RangoPrecios {
  minimo: number;
  maximo: number;
  inicial: number;
  final: number;
}
interface ListaClave {
  autores: string[];
  titulos: string[];
}

/* TODO

En el desplegable de búsqueda deben estar TODOS los libros y cuando el usuario seleccione uno,
si no está cargado, se debe cargar. ¿Cómo? Ese listado se logra de llamar a la API.

¿Se debería espaciar en el tiempo, más bien, la carga desde la API para tener un llamado por segundo, por ejemplo?

PROBAR PRIMERO: Llamar TODOS los libros a la API, pero cargar solo las imágenes visibles.

*/

@Component({
  selector: 'lt-libros',
  templateUrl: './libros.component.html',
  styleUrls: ['./libros.component.scss']
})
export class LibrosComponent implements OnInit {
  iconoTitulo: IconDefinition = faBook;
  iconoAutor: IconDefinition = faPenNib;
  textoA: IconDefinition = faArrowDownAZ;
  textoD: IconDefinition = faArrowDownZA;
  preciosA: IconDefinition = faArrowDown19;
  preciosD: IconDefinition = faArrowDown91;
  orden: 'autor-a' | 'autor-d' | 'titulo-a' | 'titulo-d' | 'precios-a' | 'precios-d' = 'autor-a';
  libros: Libro[] = [];
  librosFiltrados: Libro[] = [];
  idioma: string = 'es';
  interfaz: any;
  listaClaves: ListaClave = {} as ListaClave;
  listaSel: ListaClave = {} as ListaClave;
  clave: string = '';
  rangoPrecios: RangoPrecios = {
    minimo: 0,
    maximo: 0,
    inicial: 0,
    final: 0
  };
  bpPantalla!: string | undefined;
  anchos = new Map([
    [Breakpoints.XSmall, 'xs'],
    [Breakpoints.Small, 'sm'],
    [Breakpoints.Medium, 'md'],
    [Breakpoints.Large, 'lg'],
    [Breakpoints.XLarge, 'xl'],
  ]);
  tamanoLibro: number[] = [0, 0];
  numLibrosPorFila: number = 3;
  numLibrosVisiblesTotales: number = 10;
  numLibrosVisiblesActual: number = 0;
  numLibrosVisibles: number = this.numLibrosVisiblesTotales;
  constructor(
    private data: DataService,
    private breakpoint: BreakpointObserver,
    private dialogoFicha: Dialog
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
        for (const tam of Object.keys(result.breakpoints)) if (result.breakpoints[tam]) this.bpPantalla = this.anchos.get(tam);
      });
  }
  ngOnInit(): void {
    this.data.getInterfaz().subscribe(((interfaz: any) => interfaz.libros ? this.interfaz = interfaz.libros : null));
    this.data.getLibros().subscribe((_libros: Libro[]) => {
      this.libros = _libros;
      this.listaClaves = {
        autores: [],
        titulos: []
      };
      // if (this.libros[this.numLibrosVisiblesActual]) this.cargaInfoLibros();
      this.libros.forEach((libro: Libro) => this.getLibroInfo(libro));
      this.rangoPrecios.minimo = this.libros.map((l: Libro) => l.valor).sort((a: number, b: number) => this.ordena(a, b)).shift() ?? 0;
      this.rangoPrecios.maximo = this.libros.map((l: Libro) => l.valor).sort((a: number, b: number) => this.ordena(a, b)).pop() ?? 0;
      this.rangoPrecios.inicial = this.rangoPrecios.minimo;
      this.rangoPrecios.final = this.rangoPrecios.maximo;
    });
  }
  cargaInfoLibros(): void {
    while (this.numLibrosVisiblesActual < this.numLibrosVisiblesTotales) {
      this.getLibroInfo(this.libros[this.numLibrosVisiblesActual]);
      this.numLibrosVisiblesActual++;
    }
  }
  finalizaRenderFicha(ev: boolean): void {
    const body: HTMLElement = document.documentElement.querySelector('body') || document.body as HTMLElement;
    const altoDoc: number = window.innerHeight;
    const librosComp: HTMLElement = body.querySelector('.libros') as HTMLElement;
    const altoNavBar: number = (body.querySelector('.navbar') as HTMLElement).offsetHeight;
    const altoHeader: number = (librosComp.querySelector('.header') as HTMLElement).offsetHeight;
    const fichasLibros: HTMLElement = librosComp.querySelector('.fichas-libros') as HTMLElement;
    const ficha: HTMLElement = fichasLibros.querySelector('.libro') as HTMLElement;
    const altoDisponible: number = altoDoc - altoNavBar - altoHeader;
    const anchoDisponible: number = window.innerWidth;
    this.tamanoLibro = [
      Math.max(this.tamanoLibro[0], ficha.offsetWidth),
      Math.max(this.tamanoLibro[1], ficha.offsetHeight),
    ];
    this.numLibrosPorFila = Math.max(Math.floor(anchoDisponible / this.tamanoLibro[0]), this.numLibrosPorFila);
    this.numLibrosVisibles = Math.max(
      this.numLibrosPorFila * (Math.floor(altoDisponible / this.tamanoLibro[1]) + 1),
      this.numLibrosVisibles
    );
    if (this.numLibrosVisibles > this.numLibrosVisiblesTotales) {
      this.numLibrosVisiblesTotales = this.numLibrosVisibles;
      if (this.libros[this.numLibrosVisiblesActual]) this.cargaInfoLibros();
    }
  }
  getLibroInfo(libro: Libro, segundoIntento: boolean = false): void {
    const resultado: Subscription = this.data.getLibroInfo(libro).subscribe((libroInfo: any) => {
      resultado.unsubscribe();
      const pos: number = this.verificaInfoLibro(libroInfo, libro);
      if (pos > -1) {
        const libroBase: any = libroInfo.items[pos].volumeInfo;
        libro.titulo = libroBase.title ?? undefined;
        libro.autores = libroBase.authors ?? [];
        libro.subtitulo = libroBase.subtitle ?? undefined;
        libro.editorial = libroBase.publisher ?? undefined;
        libro.fecha = new Date(libroBase.publishedDate) ?? undefined;
        libro.descripcion = libroBase.description ?? undefined;
        libro.numPaginas = libroBase.pageCount ?? undefined;
        libro.categorias = libroBase.categories ?? undefined;
        libro.idioma = libroBase.language ?? undefined;
        libro.portada = libroBase.imageLinks ? libroBase.imageLinks.thumbnail : undefined;
        if (libro.autores) this.listaClaves.autores.push(...libro.autores);
        if (libro.titulo) this.listaClaves.titulos.push(libro.titulo);
        this.librosFiltrados.push(JSON.parse(JSON.stringify(libro)));
        this.cambiaOrden();
      } else {
        libro.barcode = null;
        if (!segundoIntento) this.getLibroInfo(libro, true);
      }
    });
  }
  verificaInfoLibro(libroInfo: any, libro: Libro): number {
    let num: number = -1;
    if (!libroInfo || !libroInfo.items) return num;
    num = libroInfo.items.findIndex((info: any) => {
      return info.volumeInfo &&
        info.volumeInfo.title &&
        info.volumeInfo.authors &&
        info.volumeInfo.authors.length &&
        info.volumeInfo.imageLinks ?
        true : false;
    });
    return num;
  }
  abreModal(libro: Libro): void {
    if (this.bpPantalla == 'xs') this.dialogoFicha.open(FichaLibroComponent, { data: libro });
  }
  aCOP(num: number): string {
    return formatCurrency(num, 'es-CO', '$', 'COP', '3.0');
  }
  cambiaRangoPrecios(pos: 0 | 1, valor: number): void {
    if (pos == 0) this.rangoPrecios.inicial = valor;
    if (pos == 1) this.rangoPrecios.final = valor;
    this.filtra();
  }
  ordena(a: any, b: any): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }
  cambiaClave(): void {
    this.listaSel.autores = this.listaClaves.autores.filter((pal: string) => pal.toLowerCase().includes(this.clave.toLowerCase()));
    this.listaSel.titulos = this.listaClaves.titulos.filter((pal: string) => pal.toLowerCase().includes(this.clave.toLowerCase()));
    this.filtra();
  }
  filtra(): void {
    this.librosFiltrados = this.libros.filter((l: Libro) => {
      return (
        l.autores?.some((a: string) => a.toLowerCase().includes(this.clave.toLowerCase())) ||
        l.titulo?.toLowerCase().includes(this.clave.toLowerCase())
      ) &&
        (
          l.valor >= this.rangoPrecios.inicial &&
          l.valor <= this.rangoPrecios.final
        );
    });
    this.cambiaOrden();
  }
  cambiaOrden(): void {
    switch (this.orden) {
      case 'autor-a':
        this.librosFiltrados.sort((a: Libro, b: Libro) => this.ordena(a.autores ? a.autores[0] : '', b.autores ? b.autores[0] : ''));
        break;
      case 'autor-d':
        this.librosFiltrados.sort((a: Libro, b: Libro) => this.ordena(b.autores ? b.autores[0] : '', a.autores ? a.autores[0] : ''));
        break;
      case 'titulo-a':
        this.librosFiltrados.sort((a: Libro, b: Libro) => this.ordena(a.titulo ?? '', b.titulo ?? ''));
        break;
      case 'titulo-d':
        this.librosFiltrados.sort((a: Libro, b: Libro) => this.ordena(b.titulo ?? '', a.titulo ?? ''));
        break;
      case 'precios-a':
        this.librosFiltrados.sort((a: Libro, b: Libro) => this.ordena(a.valor, b.valor));
        break;
      case 'precios-d':
        this.librosFiltrados.sort((a: Libro, b: Libro) => this.ordena(b.valor, a.valor));
        break;
    }
  }
  scrollAlFinal(ev: boolean): void {
    if (ev && this.libros[this.numLibrosVisiblesActual]) {
      this.numLibrosVisiblesTotales += this.numLibrosPorFila;
      this.cargaInfoLibros();
    }
  }
}