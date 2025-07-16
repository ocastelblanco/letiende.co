import { Injectable, signal, WritableSignal } from '@angular/core';
import { MenuItem } from 'primeng/api';

export interface NavbarItem extends MenuItem {
  tipoIcono: 'primeng' | 'material_symbol' | 'material_icon' | 'fontawesome';
}
export interface IdiomaItem extends MenuItem {
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class LtConfig {
  public navbarItems: NavbarItem[] = [
    { label: 'Inicio', icon: 'pi-home', tipoIcono: 'primeng', routerLink: '/inicio', },
    { label: 'Menú', icon: 'menu_book_2', tipoIcono: 'material_symbol', routerLink: '/menu', },
  ];
  public iconosTema: any = {
    light: 'pi-sun',
    dark: 'pi-moon',
  };
  public idiomaItems: IdiomaItem[] = [
    { label: 'ES', flag: 'co' },
    { label: 'EN', flag: 'gb' },
  ];
  idioma: WritableSignal<string> = signal('ES');
  modoTema: WritableSignal<string> = signal('light');
}
