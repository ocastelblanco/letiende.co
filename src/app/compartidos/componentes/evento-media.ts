import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, input, PLATFORM_ID, signal } from '@angular/core';
import { Cloudinary, CloudinaryImage, CloudinaryVideo } from '@cloudinary/url-gen/index';
import { quality, format } from '@cloudinary/url-gen/actions/delivery';
import { auto as autoQuality } from '@cloudinary/url-gen/qualifiers/quality';
import { auto as autoFormat } from '@cloudinary/url-gen/qualifiers/format';
import { CloudinaryModule } from '@cloudinary/ng';

@Component({
  selector: 'lt-evento-media',
  imports: [CloudinaryModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="evento-media-contenedor">
      @if (esVideo() && esBrowser) {
        <advanced-video [cldVid]="videoOptimizado"
                        class="evento-media"
                        muted
                        autoplay
                        loop
                        playsinline />
        <button type="button"
                class="boton-sonido"
                (click)="toggleSonido()">
          <span class="material-symbols-outlined">
            {{ sonidoActivo() ? 'volume_up' : 'volume_off' }}
          </span>
        </button>
      } @else {
        <advanced-image [cldImg]="imagenOptimizada"
                        class="evento-media" />
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .evento-media-contenedor {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      border-radius: 0.75rem 0.75rem 0 0;
    }
    .evento-media {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
    }
    :host ::ng-deep .evento-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
    }
    .boton-sonido {
      position: absolute;
      bottom: 0.75rem;
      right: 0.75rem;
      width: 2.25rem;
      height: 2.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      color: white;
      cursor: pointer;
      transition: background 0.2s ease;
      z-index: 2;

      &:hover {
        background: rgba(0, 0, 0, 0.7);
      }

      .material-symbols-outlined {
        font-size: 1.125rem;
      }
    }
  `]
})
export class EventoMedia {
  readonly mediaId = input.required<string>();
  readonly tipoMedia = input.required<'image' | 'video'>();

  private readonly cld: Cloudinary = inject(Cloudinary);
  private readonly platID: object = inject(PLATFORM_ID);
  private readonly el: ElementRef = inject(ElementRef);

  readonly esBrowser: boolean = isPlatformBrowser(this.platID);
  readonly sonidoActivo = signal<boolean>(false);

  esVideo(): boolean {
    return this.tipoMedia() === 'video';
  }

  get imagenOptimizada(): CloudinaryImage {
    return this.cld.image(this.mediaId())
      .delivery(quality(autoQuality()))
      .delivery(format(autoFormat()));
  }

  get videoOptimizado(): CloudinaryVideo {
    return this.cld.video(this.mediaId())
      .delivery(quality(autoQuality()))
      .delivery(format(autoFormat()));
  }

  toggleSonido(): void {
    const video: HTMLVideoElement | null = (this.el.nativeElement as HTMLElement).querySelector('video');
    if (video) {
      video.muted = !video.muted;
      this.sonidoActivo.set(!video.muted);
    }
  }
}
