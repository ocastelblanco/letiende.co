import { Injectable, inject } from '@angular/core';
import { Storage, ref, getDownloadURL } from '@angular/fire/storage';
import { Observable, from, of, shareReplay, map, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseStorage {
  private storage: Storage = inject(Storage);
  private urlCache: Map<string, Observable<string>> = new Map<string, Observable<string>>();

  /**
   * Obtiene la URL de descarga de una imagen con cache
   * @param imagePath Ruta de la imagen en Firebase Storage
   * @returns Observable con la URL de descarga
   */
  getImageUrl(imagePath: string): Observable<string> {
    // Verificar si ya existe en cache
    if (this.urlCache.has(imagePath)) {
      return this.urlCache.get(imagePath)!;
    }

    // Crear observable para obtener la URL
    const url$ = from(
      getDownloadURL(ref(this.storage, imagePath))
    ).pipe(
      shareReplay(1), // Cache el resultado
      catchError((error) => {
        console.error(`Error loading image ${imagePath}:`, error);
        // Limpiar cache en caso de error
        this.urlCache.delete(imagePath);
        throw error;
      })
    );

    // Guardar en cache
    this.urlCache.set(imagePath, url$);
    return url$;
  }

  /**
   * Precarga una imagen para mejorar el rendimiento
   * @param imagePath Ruta de la imagen
   */
  preloadImage(imagePath: string): Observable<boolean> {
    return this.getImageUrl(imagePath).pipe(
      map(url => {
        const img = new Image();
        img.src = url;
        return true;
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Precarga múltiples imágenes
   * @param imagePaths Array de rutas de imágenes
   */
  preloadImages(imagePaths: string[]): Observable<(boolean | undefined)[]> {
    return from(
      Promise.all(
        imagePaths.map(path =>
          this.preloadImage(path).toPromise()
        )
      )
    );
  }

  /**
   * Limpia el cache de URLs
   */
  clearCache(): void {
    this.urlCache.clear();
  }

  /**
   * Limpia una URL específica del cache
   * @param imagePath Ruta de la imagen a limpiar
   */
  clearImageCache(imagePath: string): void {
    this.urlCache.delete(imagePath);
  }
}
