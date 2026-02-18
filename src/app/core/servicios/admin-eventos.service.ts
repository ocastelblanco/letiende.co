import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EventosResponse } from '@servicios/datos';

export interface GuardarEventosPayload {
  seccion: 'eventos';
  idiomas: EventosResponse['idiomas'];
  metadata?: EventosResponse['metadata'];
}

export interface CalendarPayload {
  accion: 'crear' | 'editar' | 'eliminar';
  evento: {
    id: string;
    titulo: string;
    descripcion: string;
    fecha_inicio: string;
    fecha_fin: string;
    ubicacion: string;
  };
}

export interface ApiResponse {
  success: boolean;
  message: string;
  seccion?: string;
  url?: string;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminEventosService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl: string = 'https://api.letiende.co';
  private readonly appsScriptUrl: string =
    'https://script.google.com/macros/s/AKfycbzfHorMqHK7UFhimRhTHNhsN8VTnwHVYqCqGOGFyWZ8gNb0zy0_Th7F2BEAC7mnYWy2/exec';

  guardarEventos(payload: GuardarEventosPayload): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/actualizarContenido`, payload);
  }

  sincronizarConCalendario(payload: CalendarPayload): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.appsScriptUrl, payload);
  }

  eliminarDeCalendario(eventoId: string): Observable<ApiResponse> {
    const payload: CalendarPayload = {
      accion: 'eliminar',
      evento: {
        id: eventoId,
        titulo: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        ubicacion: '',
      },
    };
    return this.http.post<ApiResponse>(this.appsScriptUrl, payload);
  }
}
