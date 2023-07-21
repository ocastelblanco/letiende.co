import { Component, OnInit } from '@angular/core';
import { DataService, Menu } from 'src/app/servicios/data.service';

interface Elemento {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string;
  valor: number;
  hijos: Elemento[];
}

@Component({
  selector: 'lt-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  menu: Elemento[] = [];
  constructor(private data: DataService) { }
  ngOnInit(): void {
    this.data.getMenu().subscribe((menu: Menu[]) => {
      if (menu.length > 0) {
        menu.forEach((el: Menu) => {
          const elemento: Elemento = {
            id: el.id,
            titulo: el.titulo,
            descripcion: el.descripcion,
            imagen: el.imagen,
            valor: el.valor,
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
