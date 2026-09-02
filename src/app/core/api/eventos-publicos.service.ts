import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { environment } from '@environments/environment';

/**
 * Subconjunto de lo que expone Ágora. Nombres de campo verificados contra
 * agora/src/app/core/models/evento.model.ts (interfaz EventoPublico) el
 * 02/09/2026 — no existen `titulo`, `fechaInicio`, `imagenAfiche` ni `lugar`
 * en la respuesta real; Ágora no rastrea un lugar por evento (tech-specs.md
 * §4.3).
 */
export interface EventoEnCartelera {
  readonly slug: string;
  readonly nombre: string;
  readonly fechaHora: string; // ISO-8601
  readonly imagenUrl?: string;
}

/**
 * Lee GET /api/eventos-publicos directamente de Ágora, en el servidor
 * durante el SSR (tech-specs.md §5) — nunca desde el navegador contra otro
 * dominio, así se evita CORS y una petición extra en el cliente.
 *
 * Ágora ya devuelve el arreglo ordenado por fechaHora ascendente
 * (server/api/handlers/eventos-publicos.ts), sin envoltorio: el recurso es
 * directamente EventoEnCartelera[] | undefined, nunca un objeto con una
 * propiedad `eventos`.
 */
@Injectable({ providedIn: 'root' })
export class EventosPublicosService {
  readonly cartelera = httpResource<EventoEnCartelera[]>(
    () => `${environment.urlBaseApiAgora}/api/eventos-publicos`,
  );
}
