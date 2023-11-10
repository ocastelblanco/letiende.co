import { Component, OnInit, ViewChild, effect } from '@angular/core';
import { DataService, Menu } from 'src/app/servicios/data.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { IconDefinition, faBullhorn, faHeart, faCertificate } from '@fortawesome/free-solid-svg-icons';
import { MatMenuTrigger } from '@angular/material/menu';
import { trigger, stagger, query, style, animate, transition } from '@angular/animations';

interface Elemento {
  id: number;
  titulo: any;
  descripcion: any;
  valor: number;
  visible: boolean;
  imagen: string;
  posicion: number;
  hijos: Elemento[];
}
interface TipoImagen {
  tipo: string;
  ruta: string;
  icono: IconDefinition;
}

@Component({
  selector: 'lt-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  animations: [
    trigger('subcategorias', [
      transition(':enter', [
        query('.subcategoria', [
          style({ opacity: 0, transform: 'translateX(-100%)' }),
          stagger(50, [
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'none' }))
          ])
        ]),
      ])
    ]),
  ]
})
export class MenuComponent implements OnInit {
  @ViewChild(MatMenuTrigger) menuProm: MatMenuTrigger = {} as MatMenuTrigger;
  promo: IconDefinition = faBullhorn;
  heart: IconDefinition = faHeart;
  certificate: IconDefinition = faCertificate;
  bpPantalla!: string | undefined;
  anchos = new Map([
    [Breakpoints.XSmall, 'xs'],
    [Breakpoints.Small, 'sm'],
    [Breakpoints.Medium, 'md'],
    [Breakpoints.Large, 'lg'],
    [Breakpoints.XLarge, 'xl'],
  ]);
  menu: Elemento[] = [];
  idioma: string = 'es';
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
    effect(() => this.idioma = this.data.idioma());
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
        setTimeout(() => this.menuProm.openMenu(), 1000);
      }
    });
  }
  imagenFondo(ruta: string): string {
    return 'url(' +
      (ruta.substring(0, 4) == 'http' || ruta.substring(0, 3) == 'www' ? '' : 'assets/menu/') +
      ruta + ')';
  }
  imagenProducto(imagen: string): TipoImagen {
    const salida: TipoImagen = {
      icono: {} as IconDefinition,
      tipo: 'vacio',
      ruta: ''
    };
    if (imagen) {
      salida.tipo = 'imagen';
      salida.ruta = imagen;
      if (!imagen.includes('.')) {
        salida.tipo = 'icono';
        switch (imagen) {
          case 'heart':
            salida.icono = this.heart;
            break;
          case 'certificate':
            salida.icono = this.certificate;
            break;
          default:
            salida.icono = this.promo;
        }
      }
    }
    return salida;
  }
  simplifica(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s/g, '-')
      .toLowerCase();
  }
}
