import { Dialog } from '@angular/cdk/dialog';
import { Component, ElementRef, Input, ViewChild, OnDestroy, AfterViewInit, ChangeDetectorRef, inject, effect } from '@angular/core';
import { ImageDialogComponent } from './image-dialog/image-dialog.component';
import { ElementoAuditorio, DataService } from 'src/app/servicios/data.service';

@Component({
  selector: 'lt-carrusel',
  templateUrl: './carrusel.component.html',
  styleUrl: './carrusel.component.scss'
})
export class CarruselComponent implements AfterViewInit, OnDestroy {
  // --- Imágenes de ejemplo (igual que antes) ---
  @Input() imagenes: ElementoAuditorio[] = [
    {
      "titulo": {
        "es": "Consola",
        "en": "Mixer"
      },
      "descripcion": {
        "es": "<strong>Modelo:</strong> XENYX X2222USB",
        "en": "<strong>Model:</strong> XENYX X2222USB"
      },
      "imagen": "https://www.mediatekis.com.co/media/catalog/product/cache/7c37608a0ced941863e2dadf4d54b13d/x/2/x2222usb_3.jpg",
      "link": "https://www.behringer.com/product.html?modelCode=0601-ADA"
    },
    {
      "titulo": {
        "es": "Parlantes activos",
        "en": "Active loudspeakers"
      },
      "descripcion": {
        "es": "<strong>Modelo:</strong> EUROLIVE B215D",
        "en": "<strong>Model:</strong> EUROLIVE B215D"
      },
      "imagen": "https://superaudio.com.co/wp-content/uploads/2024/10/B215D-BEHRINGER-CABINAACTIVA-3-1.jpg",
      "link": "https://www.behringer.com/product.html?modelCode=0313-ADG"
    },
    {
      "titulo": {
        "es": "Tarima",
        "en": "Platform"
      },
      "descripcion": {
        "es": "<strong>Tamaño:</strong> 16m2",
        "en": "<strong>Size:</strong> 16m2"
      },
      "imagen": "https://live.staticflickr.com/7167/6770113909_07430e9b44_c_d.jpg",
      "link": ""
    },
    {
      "titulo": {
        "es": "Micrófonos",
        "en": "Microphones"
      },
      "descripcion": {
        "es": "<strong>Modelo:</strong> Ultravoice<br><strong>Cantidad:</strong> 3",
        "en": "<strong>Model:</strong> Ultravoice<br><strong>Number:</strong> 3"
      },
      "imagen": "https://http2.mlstatic.com/D_NQ_NP_617714-MLU70014306246_062023-O.webp",
      "link": "https://www.behringer.com/series.html?category=R-BEHRINGER-ULTRAVOICESERIES"
    },
    {
      "titulo": {
        "es": "Ventiladores de pedestal",
        "en": "Pedestal fan"
      },
      "descripcion": {
        "es": "<strong>Cantidad:</strong> 3",
        "en": "<strong>Number:</strong> 4"
      },
      "imagen": "https://groupesebcol.vtexassets.com/arquivos/ids/169621/5861033768-1.jpg.jpg?v=638749848624270000&width=800&height=800&aspect=true-800-800",
      "link": "https://www.imusa.com.co/ventilador-pedestal-samurai-air-power-negro/p"
    },
    {
      "titulo": {
        "es": "Asilamiento acústico",
        "en": "Acustic insulation"
      },
      "descripcion": {
        "es": "Aislamiento acústico en las paredes, para evitar que ingrese sonido al auditorio.",
        "en": "Acoustic insulation on the walls, to prevent sound from entering the auditorium."
      },
      "imagen": "https://live.staticflickr.com/1193/1332993997_d1735a9968_c_d.jpg",
      "link": ""
    }
  ];
  // --- Fin Imágenes de ejemplo ---
  idioma: string = 'es';

  @ViewChild('contenedor') private contenedorRef?: ElementRef<HTMLDivElement>;
  @ViewChild('imgs') private imagenesRef?: ElementRef<HTMLDivElement>;

  // --- Propiedades para el Drag & Drop ---
  private isDragging: boolean = false;
  private startX: number = 0;
  private currentTranslateX: number = 0; // Posición translateX al inicio del drag
  private lastTranslateX: number = 0; // Posición translateX final (después de drag o click)
  private animationFrameId: number | null = null;
  private onlyClick: boolean = false; // Para evitar el click después de un drag

  // --- Variables calculadas ---
  private imagenWidth: number = 0; // Ancho de una imagen + gap
  private gap: number = 20; // Asumiendo gap + bordes = 20px (ajustar si es necesario o calcular dinámicamente)
  private minTranslateX: number = 0; // Límite izquierdo del scroll
  private transitionStyle: string = ''; // Para guardar y restaurar la transición CSS
  private isInitialized: boolean = false; // Bandera para asegurar cálculos después de renderizado

  private dialog: Dialog = inject(Dialog);

  constructor(
    private cdr: ChangeDetectorRef,
    private dataServicio: DataService,
  ) {
    effect(() => this.idioma = this.dataServicio.idioma());
  }

  ngAfterViewInit(): void {
    // Es importante calcular las dimensiones después de que la vista se inicialice
    // Usamos un pequeño timeout para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
      this.calculateDimensions();
      this.isInitialized = true; // Marcar como inicializado después de calcular dimensiones
      // Guardamos el estilo de transición original
      if (this.imagenesRef?.nativeElement) {
        this.transitionStyle = this.imagenesRef.nativeElement.style.transition;
      }
      this.applyParallaxEffects(); // Aplicar parallax inicial
    }, 0);
  }

  ngOnDestroy(): void {
    // Limpia listeners si el componente se destruye mientras se arrastra
    this.removeDragListeners();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
  abreImagen(index: number): void {
    // Solo abre el diálogo si es un click puro (no un drag)
    // Verificamos si hubo movimiento significativo durante el pointerdown/up
    // Una pequeña tolerancia para clics accidentales con ligero movimiento
    const movedDistance = Math.abs(this.getCurrentTranslateX() - this.currentTranslateX);
    const isClick = movedDistance < 5; // Tolerancia de 5px, ajustar si es necesario

    if (!isClick) return;

    this.dialog.open(ImageDialogComponent, {
      height: '100%',
      data: this.imagenes[index],
    });
  }
  private calculateDimensions(): void {
    if (!this.imagenesRef?.nativeElement || !this.contenedorRef?.nativeElement) return;

    const firstImage: HTMLElement | null = this.imagenesRef.nativeElement.querySelector('.imagen');
    if (!firstImage) return;

    const style: CSSStyleDeclaration = window.getComputedStyle(firstImage);
    this.imagenWidth = firstImage.offsetWidth + parseFloat(style.marginLeft); // Ancho + margen izquierdo

    const contenedorWidth: number = this.contenedorRef.nativeElement.offsetWidth;
    const imagenesTotalWidth: number = this.imagenesRef.nativeElement.offsetWidth + (this.imagenesRef.nativeElement.offsetWidth / this.imagenes.length);

    // El límite izquierdo es 0 o negativo si el contenido excede el contenedor
    this.minTranslateX = Math.min(0, contenedorWidth - imagenesTotalWidth);

    // Ajusta la posición inicial si es necesario (ej. si se redimensiona la ventana)
    this.lastTranslateX = this.clampTranslateX(this.lastTranslateX);
    this.applyTransform(this.lastTranslateX, false); // Aplicar sin animación inicial

    this.cdr.detectChanges(); // Notificar a Angular de los cambios si es necesario
  }

  // --- Lógica de Navegación con Botones ---
  mueve(direccion: -1 | 1): void {
    if (!this.imagenesRef?.nativeElement) return;

    // Calcula el desplazamiento basado en el ancho de la imagen
    let targetTranslateX: number = this.lastTranslateX + (this.imagenWidth * direccion * -1);

    // Asegura que el target esté dentro de los límites
    targetTranslateX = this.clampTranslateX(targetTranslateX);

    // Aplica la transformación con animación
    this.applyTransform(targetTranslateX, true);
    this.lastTranslateX = targetTranslateX; // Actualiza la última posición conocida
    this.applyParallaxEffects(); // Actualiza parallax después de la navegación
  }

  // --- Lógica de Arrastre (Drag) con Pointer Events ---
  onPointerDown(event: PointerEvent): void {
    // Previene el comportamiento por defecto (como seleccionar texto o arrastrar imagen fantasma)
    // event.preventDefault(); // Puede prevenir clics en botones si no se maneja bien, probar con/sin

    if (!this.imagenesRef?.nativeElement) return;

    this.isDragging = true;
    this.startX = event.clientX; // Posición inicial del puntero
    this.currentTranslateX = this.lastTranslateX; // Guarda la posición actual antes de arrastrar

    // Desactiva la transición CSS para un movimiento directo durante el drag
    this.imagenesRef.nativeElement.style.transition = 'none';
    this.imagenesRef.nativeElement.style.cursor = 'grabbing'; // Feedback visual

    // Añade listeners globales para mover y soltar
    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('pointercancel', this.onPointerUp); // También maneja cancelaciones
  }
  // Usamos arrow functions para mantener el contexto 'this' correcto
  private onPointerMove = (event: PointerEvent): void => {
    if (!this.isDragging || !this.imagenesRef?.nativeElement) return;

    // Calcula cuánto se ha movido el puntero
    const currentX: number = event.clientX;
    const deltaX: number = currentX - this.startX;

    // Calcula la nueva posición translateX
    let newTranslateX: number = this.currentTranslateX + deltaX;

    // Aplica la transformación inmediatamente (sin animación)
    // Usamos requestAnimationFrame para optimizar el repintado durante el drag
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(() => {
      // Aplicamos límites suaves durante el drag (opcional, pero mejora la UX)
      const limitedTranslateX: number = this.applyDragLimits(newTranslateX); // Limita el arrastre
      this.applyParallaxEffects(); // Apply parallax during drag
      this.applyTransform(limitedTranslateX, false);
    });
  };
  // Usamos arrow functions para mantener el contexto 'this' correcto
  private onPointerUp = (event: PointerEvent): void => {
    if (!this.isDragging || !this.imagenesRef?.nativeElement) return;

    this.isDragging = false;

    // Restaura la transición CSS para la animación final (si hay snapping) o el estado normal
    this.imagenesRef.nativeElement.style.transition = this.transitionStyle;
    this.imagenesRef.nativeElement.style.cursor = 'grab'; // Restaura cursor

    // Guarda la posición final después del drag
    // Leemos la transformación actual aplicada en el último onPointerMove
    const currentTransform: number = this.getCurrentTranslateX();
    this.lastTranslateX = this.clampTranslateX(currentTransform); // Asegura que esté dentro de límites estrictos

    // Opcional: Implementar "Snapping" para que termine alineado con una imagen
    // Si no hay snapping, simplemente nos aseguramos de que esté dentro de los límites
    this.applyTransform(this.lastTranslateX, true); // Anima suavemente el contenedor a la posición final válida
    this.applyParallaxEffects(); // Aplica parallax final después de soltar

    // Limpia listeners globales
    this.removeDragListeners();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  };
  private removeDragListeners(): void {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    document.removeEventListener('pointercancel', this.onPointerUp);
  }

  // --- Funciones Auxiliares ---

  // Aplica la transformación translateX al contenedor de imágenes
  private applyTransform(translateX: number, useTransition: boolean = true): void {
    if (!this.imagenesRef?.nativeElement) return;
    this.imagenesRef.nativeElement.style.transition = useTransition ? this.transitionStyle : 'none';
    this.imagenesRef.nativeElement.style.transform = `translateX(${translateX}px)`;
  }
  // Aplica el efecto parallax a cada imagen individualmente
  private applyParallaxEffects(): void {
    // Asegurarse de que el componente esté inicializado y los elementos DOM disponibles
    if (!this.isInitialized || !this.imagenesRef?.nativeElement || !this.contenedorRef?.nativeElement) return;

    const containerRect = this.contenedorRef.nativeElement.getBoundingClientRect();
    const containerVisibleWidth = containerRect.width;
    const containerLeft = containerRect.left;

    // Iterar sobre cada contenedor de imagen (.imagen)
    const imageElements = this.imagenesRef.nativeElement.children;

    for (let i = 0; i < imageElements.length; i++) {
      const imageElement = imageElements[i] as HTMLElement; // El div .imagen
      const imgElement = imageElement.querySelector('img');
      if (!imgElement) continue;

      const imageElementRect = imageElement.getBoundingClientRect(); // Rect del div .imagen
      const imgWidth = imgElement.offsetWidth; // Ancho real renderizado de la etiqueta <img>

      // Calcular la posición del centro del div .imagen respecto al viewport
      const imageElementCenterX = imageElementRect.left + imageElementRect.width / 2;

      // Calcular un factor basado en la posición del centro del div .imagen dentro del contenedor visible
      // Este factor va de 0 (centro del div .imagen en el borde izquierdo del contenedor visible)
      // a 1 (centro del div .imagen en el borde derecho del contenedor visible).
      const centerFactor = (imageElementCenterX - containerLeft) / containerVisibleWidth;

      // Clampear el factor al rango [0, 1] para manejar imágenes fuera del área visible
      const clampedCenterFactor = Math.max(0, Math.min(1, centerFactor));

      // Calcular el porcentaje de translateX deseado (50% en borde izq, 0% en borde der)
      const translateXPercentage = 50 - clampedCenterFactor * 50;

      // Convertir el porcentaje a píxeles basado en el ancho real de la etiqueta <img>
      const parallaxOffsetPixels = (translateXPercentage / 100) * imgWidth;

      // Aplicar la transformación a la etiqueta <img>
      imgElement.style.transform = `translateX(${parallaxOffsetPixels}px)`;
    }
  }
  // Obtiene el valor numérico actual de translateX
  private getCurrentTranslateX(): number {
    if (!this.imagenesRef?.nativeElement) return 0;
    const style: CSSStyleDeclaration = window.getComputedStyle(this.imagenesRef.nativeElement);
    // Usamos DOMMatrixReadOnly para una forma robusta de obtener el valor
    const matrix: DOMMatrixReadOnly = new DOMMatrixReadOnly(style.transform);
    return matrix.m41; // m41 es el valor de translateX
  }

  // Asegura que el valor de translateX esté dentro de los límites permitidos
  private clampTranslateX(value: number): number {
    return Math.max(this.minTranslateX, Math.min(0, value));
  }

  // Aplica límites suaves durante el drag (permite arrastrar un poco más allá del límite)
  private applyDragLimits(value: number): number {
    const overshoot: number = 50; // Píxeles que se permite sobrepasar el límite
    if (value > 0) {
      // Resistencia al pasar el límite izquierdo (0)
      return Math.log10(value + 1) * overshoot;
    } else if (value < this.minTranslateX) {
      // Resistencia al pasar el límite derecho (minTranslateX)
      const over = this.minTranslateX - value;
      return this.minTranslateX - (Math.log10(over + 1) * overshoot);
    }
    return value; // Dentro de los límites normales
  }
}
