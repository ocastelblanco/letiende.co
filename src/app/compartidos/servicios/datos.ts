import { HttpClient } from '@angular/common/http';
import { inject, Injectable, isDevMode } from '@angular/core';
import { Observable } from 'rxjs';

export type IconoLT = { nombre: string, tipo: 'fas' | 'pi' | 'material-symbols-outlined' };

// Interfaces para la estructura completa del menú desde S3
export interface MenuResponse {
  seccion: string;
  idiomas: {
    es: MenuIdioma;
    en: MenuIdioma;
  };
  metadata?: {
    autor?: string;
    ultima_revision?: string;
    version?: string;
    publicado?: boolean;
    actualizacion_precios?: string;
  };
  timestamp?: string;
}

export interface MenuIdioma {
  titulo: string;
  descripcion: string;
  categorias: MenuCategoria[];
}

export interface MenuCategoria {
  id: string;
  nombre: string;
  descripcion: string;
  icono: IconoLT;
  enlace: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  moneda: string;
  disponible: boolean;
  imagen_id?: string;
  alergenos?: string[];
  vegetariano?: boolean;
  opciones?: MenuOpcion[];
}

export interface MenuOpcion {
  nombre: string;
  valores: string[];
}

@Injectable({
  providedIn: 'root'
})
export class Datos {
  private readonly http: HttpClient = inject(HttpClient);
  // En desarrollo usa el archivo local, en producción usa assets.letiende.co
  private readonly assetsUrl: string = isDevMode() ? '/' : 'https://assets.letiende.co/data/';

  getMenu(): Observable<MenuResponse> {
    return this.http.get<MenuResponse>(this.assetsUrl + 'menu.json');
  }
}
