import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, map } from 'rxjs';
import { CloudinaryConfig } from './cloudinary-config';
import { LtConfig } from './lt-config';

export interface CloudinaryUploadResponse {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
}
interface SignatureResponse {
  signature: string;
}
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
export class CloudinaryAPI {
  private http: HttpClient = inject(HttpClient);
  private cloudinaryConfig: CloudinaryConfig = inject(CloudinaryConfig);
  private config: LtConfig = inject(LtConfig);
  /**
   * Sube un archivo a Cloudinary de forma segura.
   * @param file El archivo a subir.
   * @param uploadOptions Opciones adicionales como tags, folder, etc.
   * @returns Un observable con la respuesta de Cloudinary.
   */
  upload(file: File, uploadOptions: { tags?: string, folder?: string, public_id?: string } = {}): Observable<CloudinaryUploadResponse> {
    const timestamp = Math.floor(Date.now() / 1000);
    // 1. Prepara los parámetros que quieres firmar.
    // Deben coincidir con los que enviarás a Cloudinary.
    const paramsToSign = {
      timestamp,
      ...uploadOptions
    };
    // 2. Llama a tu endpoint de backend para obtener la firma.
    return this.http.post<SignatureResponse>(`${this.config.cloudinaryAPIUrl}signature`, { params_to_sign: paramsToSign })
      .pipe(
        switchMap(response => {
          const { signature } = response;
          // 3. Prepara el FormData para la API de Cloudinary.
          const formData = new FormData();
          formData.append('file', file);
          formData.append('api_key', this.cloudinaryConfig.apiKey!);
          formData.append('timestamp', timestamp.toString());
          formData.append('signature', signature);
          // Añade las otras opciones al FormData
          Object.entries(uploadOptions).forEach(([key, value]) => {
            formData.append(key, value);
          });
          // 4. Realiza la petición POST a la API de subida de Cloudinary. ======> Se tiene que reemplazar por una llamada a la API de Cloudinary desde server.ts.
          const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudinaryConfig.cloudName}/image/upload`;
          return this.http.post<CloudinaryUploadResponse>(uploadUrl, formData);
        })
      );
  }
  /**
   * Obtiene los detalles de un recurso de Cloudinary por su public_id.
   * @param publicId El public_id del recurso que deseas obtener.
   * @returns Un observable con la respuesta de Cloudinary; es de tipo CloudinaryResource.
   */
  getResourceDetails(publicId: string): Observable<CloudinaryResource> {
    return this.http.post<CloudinaryResource>(`${this.config.cloudinaryAPIUrl}details`, { public_id: publicId });
  }
}