import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, Injectable, PLATFORM_ID, signal, WritableSignal } from '@angular/core';
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
  private document: Document = inject(DOCUMENT);
  private platID: any = inject(PLATFORM_ID);
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
  public baseUrl: string = this.getBaseUrl();
  public cloudinaryAPIUrl: string = `${this.baseUrl}api/cloudinary/`;
  public cdnUrl: string = 'https://assets.letiende.co/';
  idioma: WritableSignal<string> = signal('ES');
  modoTema: WritableSignal<string> = signal('light');
  private getBaseUrl(): string {
    let baseElement: HTMLElement | null = null;
    if (isPlatformBrowser(this.platID)) baseElement = this.document.querySelector('base') as HTMLElement;
    return baseElement?.getAttribute('href') || '/';
  }
}
