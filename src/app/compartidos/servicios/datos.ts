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

export interface EventosResponse {
  seccion: string;
  idiomas: {
    es: EventosIdioma;
    en: EventosIdioma;
  };
  metadata?: {
    autor?: string;
    ultima_revision?: string;
    version?: string;
    publicado?: boolean;
  };
  timestamp?: string;
}

export interface EventosIdioma {
  titulo: string;
  descripcion: string;
  eventos: Evento[];
}

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  ubicacion: string;
  media_id: string;
  media_tipo: 'image' | 'video';
  artistas: EventoArtista[];
  precios: EventoPrecio[];
  forma_pago: FormaPagoItem[];
  capacidad: number;
  entradas_disponibles: number;
  enlace_boletas?: string;
  enlace_instagram?: string;
  enlace_tiktok?: string;
  enlace_web?: string;
  codigo_pulep?: string;
  categorias: string[];
  destacado: boolean;
}

export interface EventoArtista {
  nombre: string;
  bio: string;
}

export interface EventoPrecio {
  categoria: string;
  valor: number;
  moneda: string;
  tipo_venta: 'preventa' | 'dia_evento';
}

export interface FormaPagoItem {
  tipo: 'atrapalo' | 'letiende' | 'whatsapp' | 'telefono';
  telefono?: string;
}

export type FormaPago = FormaPagoItem;

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

  getEventos(): Observable<EventosResponse> {
    //return this.http.get<EventosResponse>(this.assetsUrl + 'eventos.json');
    return this.http.get<EventosResponse>('https://assets.letiende.co/data/eventos.json');
  }
}
