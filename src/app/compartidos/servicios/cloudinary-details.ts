import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Interfaz que describe la estructura de la respuesta
 * de la API de detalles de un recurso de Cloudinary.
 * Puedes expandirla según los campos que necesites.
 */
export interface CloudinaryResult {
  asset_id: string;
  public_id: string;
  folder: string;
  filename: string;
  format: string;
  version: number;
  resource_type: 'image' | 'video' | 'raw';
  type: string;
  created_at: string; // ISO date string
  bytes: number;
  width: number;
  height: number;
  url: string;
  secure_url: string;
  tags?: string[];
  context?: {
    custom?: Record<string, string>;
  };
}
export interface CloudinaryResource {
  result: CloudinaryResult;
}

@Injectable({
  providedIn: 'root'
})
export class CloudinaryDetails {
  private http = inject(HttpClient);
  getResourceDetails(publicId: string): Observable<CloudinaryResource> {
    return this.http.post<CloudinaryResource>('/api/cloudinary/details', { public_id: publicId });
  }
}