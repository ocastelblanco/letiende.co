import { Component, OnInit, effect } from '@angular/core';
import { DataService, Libro } from 'src/app/servicios/data.service';
import { formatCurrency } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'lt-libros',
  templateUrl: './libros.component.html',
  styleUrls: ['./libros.component.scss']
})
export class LibrosComponent implements OnInit {
  libros: Libro[] = [];
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
    this.data.getInterfaz().subscribe(((interfaz: any) => interfaz.libros ? this.interfaz = interfaz.libros : null));
    this.data.getLibros().subscribe((libros: Libro[]) => {
      this.libros = libros;
      libros.forEach((libro: Libro) => {
        this.data.getLibroInfo(libro).subscribe((libroInfo: any) => {
          if (libroInfo && libroInfo.items && libroInfo.items[0] && libroInfo.items[0].volumeInfo) {
            const libroBase: any = libroInfo.items[0].volumeInfo;
            libro.titulo = libroBase.title ?? undefined;
            libro.subtitulo = libroBase.subtitle ?? undefined;
            libro.editorial = libroBase.publisher ?? undefined;
            libro.fecha = new Date(libroBase.publishedDate) ?? undefined;
            libro.descripcion = libroBase.description ?? undefined;
            libro.numPaginas = libroBase.pageCount ?? undefined;
            libro.categorias = libroBase.categories ?? undefined;
            libro.idioma = libroBase.language ?? undefined;
            libro.portada = libroBase.imageLinks ? libroBase.imageLinks.thumbnail : undefined;
          }
        });
      });
    });
  }
}
