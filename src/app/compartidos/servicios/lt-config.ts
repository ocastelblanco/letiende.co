import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';

export interface NavbarItem extends MenuItem {
  tipoIcono: 'primeng' | 'material_symbol' | 'material_icon' | 'fontawesome';
}

@Injectable({
  providedIn: 'root'
})
export class LtConfig {
  public navbarItems: NavbarItem[] = [
    { label: 'Inicio', icon: 'pi-home', tipoIcono: 'primeng', routerLink: '/inicio', },
    { label: 'Menú', icon: 'menu_book_2', tipoIcono: 'material_symbol', routerLink: '/menu', },
  ];
}
