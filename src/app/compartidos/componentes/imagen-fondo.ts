import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, DOCUMENT, ElementRef, inject, Input, OnDestroy, PLATFORM_ID } from '@angular/core';
import { Cloudinary, CloudinaryImage } from '@cloudinary/url-gen/index';
import { format, quality } from '@cloudinary/url-gen/actions/delivery';
import { auto as autoQuality } from '@cloudinary/url-gen/qualifiers/quality';
import { auto as autoFormat } from '@cloudinary/url-gen/qualifiers/format';
import { scale } from '@cloudinary/url-gen/actions/resize';
import { blur } from "@cloudinary/url-gen/actions/effect";
import { CloudinaryModule } from '@cloudinary/ng';
import { CloudinaryAPI, CloudinaryResource, CloudinaryResult } from '@servicios/cloudinary-api';
import { Subject, fromEvent, debounceTime, takeUntil, first } from 'rxjs';

@Component({
  selector: 'div[lt-imagen-fondo]',
  imports: [
    CloudinaryModule,
  ],
  standalone: true,
  template: `
    @if (img) {
      <advanced-image [cldImg]="img"
                      class="imagen-fondo" />
    }
    <div class="wrapper-contenido">
      <ng-content />
    </div>
  `,
  styles: [`
    :host {
      position: relative;
      display: block;
      overflow: hidden;
    }
    .imagen-fondo {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      z-index: 0;
      opacity: 0.35;
    }
    .wrapper-contenido {
      position: relative;
      z-index: 1;
    }
  `]
})
export class ImagenFondo implements AfterViewInit, OnDestroy {
  @Input() publicID: string = 'Principal';
  private el: ElementRef = inject(ElementRef);
  private platID: any = inject(PLATFORM_ID);
  private cld: Cloudinary = inject(Cloudinary);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private document: Document = inject(DOCUMENT);
  private cldAPI: CloudinaryAPI = inject(CloudinaryAPI);
  private container: HTMLElement = this.el.nativeElement as HTMLElement;
  private destroy$ = new Subject<void>();
  private imageDetails: CloudinaryResult | null = null;
  img: CloudinaryImage | null = null;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platID)) {
      return;
    }
    // 1. Obtenemos los detalles de la imagen UNA SOLA VEZ y los guardamos.
    this.cldAPI.getResourceDetails(this.publicID)
      .pipe(
        first(), // Solo tomamos el primer valor y nos desuscribimos.
        takeUntil(this.destroy$)
      )
      .subscribe((res: CloudinaryResource) => {
        this.imageDetails = res.result;
        // 2. Creamos la imagen inicial una vez que tenemos los detalles.
        this.actualizaImagen();
      });
    // 3. Nos suscribimos al evento 'resize' con un debounce para evitar llamadas excesivas.
    fromEvent(this.document.defaultView!, 'resize')
      .pipe(
        debounceTime(300), // Espera 300ms de inactividad antes de emitir.
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.actualizaImagen());
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.img = null;
    this.imageDetails = null;
  }
  private actualizaImagen(): void {
    // Si no tenemos los detalles o las dimensiones del contenedor, no hacemos nada.
    if (!this.imageDetails || this.container.offsetWidth === 0) {
      return;
    }
    const anchoCont: number = this.container.offsetWidth;
    const altoCont: number = this.container.offsetHeight;
    const relacionAspectoCont: number = anchoCont / altoCont;
    const relacionAspectoImg: number = this.imageDetails.width / this.imageDetails.height;
    // Decidimos si escalar por ancho o por alto para que la imagen siempre cubra el contenedor.
    const resizeAction = relacionAspectoImg > relacionAspectoCont ? scale().height(altoCont) : scale().width(anchoCont);
    this.img = this.cld.image(this.publicID)
      .resize(resizeAction)
      .delivery(quality(autoQuality()))
      .delivery(format(autoFormat()))
      .effect(blur(800));
    this.cdr.detectChanges();
  }
}
