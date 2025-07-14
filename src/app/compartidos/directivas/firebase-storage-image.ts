import { Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2, inject, effect, signal, WritableSignal } from '@angular/core';
import { Storage, ref, getDownloadURL, StorageReference } from '@angular/fire/storage';
import { Subject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Directive({
  selector: '[ltFirebaseStorageImage]',
  standalone: true
})
export class FirebaseStorageImage implements OnInit, OnDestroy {
  private storage: Storage = inject(Storage);
  private el: ElementRef = inject(ElementRef);
  private renderer: Renderer2 = inject(Renderer2);
  private platformId: any = inject(PLATFORM_ID);
  private destroy$: Subject<void> = new Subject<void>();

  // Signals para manejar el estado
  private isLoading: WritableSignal<boolean> = signal(false);
  private hasError: WritableSignal<boolean> = signal(false);
  private errorMessage: WritableSignal<string> = signal('');

  // Configuración de la directiva
  logoTemp: string = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij4KICA8Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyMCIgZmlsbD0iI2ZmZTZiMyIvPgogIDxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2U4NjMwYSIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiCiAgICAgZD0iTTI0IDQKICAgICAgIGEyMCAyMCAwIDAgMSAwIDQwCiAgICAgICBhMjAgMjAgMCAwIDEgMCAtNDAiCiAgICAgIHN0cm9rZS1kYXNoYXJyYXk9IjMxLjQgMTI1LjYiPgogICAgIDxhbmltYXRlVHJhbnNmb3JtIGF0dHJpYnV0ZU5hbWU9InRyYW5zZm9ybSIKICAgICAgICAgdHlwZT0icm90YXRlIgogICAgICAgICBmcm9tPSIwIDI0IDI0IgogICAgICAgICB0bz0iMzYwIDI0IDI0IgogICAgICAgICBkdXI9IjFzIgogICAgICAgICByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPgogICAgIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9InN0cm9rZS1kYXNob2Zmc2V0IgogICAgICAgIHZhbHVlcz0iMDsxNTc7MCIKICAgICAgICBkdXI9IjFzIgogICAgICAgICByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPgogIDwvcGF0aD4KPC9zdmc+';
  @Input() ltFirebaseStorageImage: string = ''; // Nombre/path de la imagen
  @Input() extension: string = 'svg'; // Extensión por defecto de la imagen
  @Input() fallbackExtension: string = 'png'; // Extensión de la imagen de fallback
  @Input() loadingImage: string = this.logoTemp; // Imagen mientras carga
  @Input() alt: string = 'Le Tiende'; // Texto alternativo
  @Input() cssClass: string = ''; // Clases CSS adicionales
  @Input() lazy: boolean = true; // Carga lazy por defecto
  @Input() storageFolder: string = 'iconos'; // Carpeta base en Storage

  // Propiedades de la imagen
  @Input() width: string = '';
  @Input() height: string = '';
  @Input() style: string = '';

  private imageElement: HTMLImageElement | null = null;
  private isInitialized: boolean = false;

  constructor() {
    // Effect para reaccionar a cambios en el path de la imagen
    // Solo ejecutar en el cliente para evitar hydration mismatch
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        if (this.ltFirebaseStorageImage && this.isInitialized) {
          console.log('La imagen cambió a ', this.ltFirebaseStorageImage);
          this.loadImage();
        }
      });
    }
  }
  ngOnInit() {
    // Solo ejecutar en el cliente para evitar hydration mismatch
    if (isPlatformBrowser(this.platformId)) {
      // Usar afterNextRender para asegurar que el DOM esté completamente hidratado
      setTimeout(() => {
        this.createImageElement();
        this.isInitialized = true;
        if (this.ltFirebaseStorageImage) {
          this.loadImage();
        }
      }, 50);
    }
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.removeImageElement();
  }
  private createImageElement() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.imageElement = this.renderer.createElement('img') as HTMLImageElement;
    // Configurar atributos básicos
    if (this.alt) {
      this.renderer.setAttribute(this.imageElement, 'alt', this.alt);
    }
    if (this.lazy) {
      this.renderer.setAttribute(this.imageElement, 'loading', 'lazy');
    }
    if (this.cssClass) {
      this.imageElement.className = this.cssClass;
    }
    // Aplicar estilos
    if (this.width) {
      this.renderer.setStyle(this.imageElement, 'width', this.width);
    }
    if (this.height) {
      this.renderer.setStyle(this.imageElement, 'height', this.height);
    }
    if (this.style) {
      this.renderer.setAttribute(this.imageElement, 'style', this.style);
    }
    // Mostrar imagen de carga si existe
    if (this.loadingImage) {
      this.renderer.setAttribute(this.imageElement, 'src', this.loadingImage);
    }
    this.renderer.appendChild(this.el.nativeElement, this.imageElement);
  }
  private removeImageElement() {
    if (this.imageElement && isPlatformBrowser(this.platformId)) {
      this.renderer.removeChild(this.el.nativeElement, this.imageElement);
      this.imageElement = null;
    }
  }
  private clearCurrentImage() {
    if (this.imageElement && isPlatformBrowser(this.platformId)) {
      // Mostrar imagen de carga si existe, o limpiar src
      if (this.loadingImage) {
        this.renderer.setAttribute(this.imageElement, 'src', this.loadingImage);
      } else {
        this.renderer.removeAttribute(this.imageElement, 'src');
      }
      // Limpiar clases de estado
      this.renderer.removeClass(this.imageElement, 'loaded');
      this.renderer.removeClass(this.imageElement, 'error');
      this.renderer.addClass(this.imageElement, 'loading');
    }
  }
  private async getRutaImagen(extension: string = this.extension): Promise<string> {
    return new Promise((resolve, reject) => {
      const imagePath: string = `${this.storageFolder}/${this.ltFirebaseStorageImage}.${extension}`;
      const imageRef: StorageReference = ref(this.storage, imagePath);
      getDownloadURL(imageRef)
        .then((url: string) => {
          resolve(url);
        }).catch((error: any) => {
          reject(error);
        });
    });
  }
  private async loadImage() {
    if (!this.ltFirebaseStorageImage || !isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      this.clearCurrentImage();
      this.performImageLoad();
    }, 0);
  }
  private async performImageLoad() {
    try {
      this.isLoading.set(true);
      this.hasError.set(false);
      const downloadURL: string = await this.getRutaImagen();
      if (this.destroy$.closed) return;
      if (this.imageElement) {
        this.renderer.setAttribute(this.imageElement, 'src', downloadURL);
        this.renderer.listen(this.imageElement, 'error', () => {
          this.handleImageError();
        });
        this.renderer.listen(this.imageElement, 'load', () => {
          this.isLoading.set(false);
          this.renderer.removeClass(this.imageElement, 'loading');
          this.renderer.addClass(this.imageElement, 'loaded');
        });
      }
    } catch (error) {
      console.error(error);
      this.handleImageError((error as any).code == 'storage/object-not-found');
    } finally {
      this.isLoading.set(false);
    }
  }
  private async handleImageError(fallback: boolean = true): Promise<void> {
    this.hasError.set(true);
    this.isLoading.set(false);
    if (this.imageElement) {
      if (fallback) {
        try {
          const downloadURL: string = await this.getRutaImagen(this.fallbackExtension);
          this.renderer.setAttribute(this.imageElement, 'src', downloadURL);
        } catch (error) {
          console.error(error);
          this.handleImageError(false); // No hay fallback, no se puede mostrar imagen
        }
      } else {
        // Imagen por defecto en caso de error --> Logo de LT
        this.renderer.setAttribute(this.imageElement, 'src', this.logoTemp);
      }
      this.renderer.removeClass(this.imageElement, 'loading');
      this.renderer.addClass(this.imageElement, 'error');
    }
  }
  // Método público para recargar la imagen
  public reload() {
    if (isPlatformBrowser(this.platformId)) this.loadImage();
  }
}
