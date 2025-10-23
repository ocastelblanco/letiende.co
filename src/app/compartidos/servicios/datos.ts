import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type IconoLT = { nombre: string, tipo: 'fas' | 'pi' | 'material-symbols-outlined' };
export interface DatoMenuLateral {
  icono: IconoLT;
  titulo: string;
  enlace: string;
}

@Injectable({
  providedIn: 'root'
})
export class Datos {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly api: string = '';

  getMenu(): Observable<DatoMenuLateral[]> {
    return this.http.get<DatoMenuLateral[]>(this.api + 'menu.json');
  }
}
