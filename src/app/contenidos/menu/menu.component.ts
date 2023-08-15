import { Component, OnInit } from '@angular/core';
import { DataService, Menu } from 'src/app/servicios/data.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

interface Elemento {
  id: number;
  titulo: string;
  descripcion: string;
  valor: number;
  visible: boolean;
  imagen: string;
  posicion: number;
  hijos: Elemento[];
}

@Component({
  selector: 'lt-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  bpPantalla!: string | undefined;
  anchos = new Map([
    [Breakpoints.XSmall, 'xs'],
    [Breakpoints.Small, 'sm'],
    [Breakpoints.Medium, 'md'],
    [Breakpoints.Large, 'lg'],
    [Breakpoints.XLarge, 'xl'],
  ]);
  menu: Elemento[] = [];
  constructor(private data: DataService, private breakpoint: BreakpointObserver) {
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
    this.data.getMenu().subscribe((menu: Menu[]) => {
      if (menu.length > 0) {
        menu.forEach((el: Menu) => {
          const elemento: Elemento = {
            id: el.id,
            titulo: el.titulo,
            descripcion: el.descripcion,
            valor: el.valor,
            posicion: el.posicion,
            visible: el.visible,
            imagen: el.imagen,
            hijos: []
          };
          if (el.tipo == 'Categoría') this.menu.push(elemento);
          if (el.tipo == 'Subcategoría') this.menu.find((elem: Elemento) => elem.id == el.padre)?.hijos.push(elemento);
          if (el.tipo == 'Producto') this.menu.forEach((cat: Elemento) => {
            if (cat.hijos) {
              cat.hijos.find((sub: Elemento) => sub.id == el.padre)?.hijos.push(elemento);
            }
          });
        });
        this.menu.sort((a: Elemento, b: Elemento) => a.posicion - b.posicion)
          .forEach((cat: Elemento) => {
            cat.hijos.sort((a: Elemento, b: Elemento) => a.posicion - b.posicion)
              .forEach((subcat: Elemento) => {
                subcat.hijos.sort((a: Elemento, b: Elemento) => a.posicion - b.posicion);
              });
          });
      }
    });
  }
  imagenFondo(ruta: string): string {
    return 'url(' +
      (ruta.substring(0, 4) == 'http' || ruta.substring(0, 3) == 'www' ? '' : 'assets/menu/') +
      ruta + ')';
  }
  simplifica(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s/g, '-')
      .toLowerCase();
  }
}
