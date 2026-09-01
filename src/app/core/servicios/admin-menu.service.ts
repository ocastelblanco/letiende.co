import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MenuResponse } from '@servicios/datos';

export interface GuardarMenuPayload {
  seccion: 'menu';
  idiomas: MenuResponse['idiomas'];
  metadata?: MenuResponse['metadata'];
}

export interface ApiMenuResponse {
  success: boolean;
  message: string;
  seccion?: string;
  url?: string;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminMenuService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl: string = 'https://api.letiende.co';

  guardarMenu(payload: GuardarMenuPayload): Observable<ApiMenuResponse> {
    return this.http.post<ApiMenuResponse>(`${this.apiUrl}/actualizarContenido`, payload);
  }
}
