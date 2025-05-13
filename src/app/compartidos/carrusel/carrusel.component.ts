import { Dialog } from '@angular/cdk/dialog';
import { Component, ElementRef, Input, ViewChild, OnDestroy, AfterViewInit, ChangeDetectorRef, inject } from '@angular/core';
import { ImageDialogComponent } from './image-dialog/image-dialog.component';

export interface Imagen {
  url: string;
  titulo: string;
  descripcion: string; // Aunque no se usa en el template actual, mantenemos la interfaz
}

@Component({
  selector: 'lt-carrusel',
  templateUrl: './carrusel.component.html',
  styleUrl: './carrusel.component.scss'
})
export class CarruselComponent implements AfterViewInit, OnDestroy {
  // --- Imágenes de ejemplo (igual que antes) ---
  @Input() imagenes: Imagen[] = [
    { titulo: 'Título 1', descripcion: 'Descripción 1', url: 'https://live.staticflickr.com/8448/7928254948_24fe7fc65f_o_d.jpg' },
    { titulo: 'Título 2', descripcion: 'Descripción 2', url: 'https://live.staticflickr.com/1810/28475735877_cca536675f_o_d.jpg' },
    { titulo: 'Título 3 Largo Largo', descripcion: 'Descripción 3', url: 'https://live.staticflickr.com/65535/54403095935_99545545a9_o_d.jpg' },
    { titulo: 'Título 4', descripcion: 'Descripción 4', url: 'https://live.staticflickr.com/2093/2426852471_8a5355c89a_o_d.jpg' },
    { titulo: 'Título 5', descripcion: 'Descripción 5', url: 'https://live.staticflickr.com/65535/51537111468_067cde6b60_o_d.jpg' },
    { titulo: 'Título 6', descripcion: 'Descripción 6', url: 'https://live.staticflickr.com/65535/52300345468_7f710ef9d8_o_d.jpg' },
    { titulo: 'Título 7', descripcion: 'Descripción 7', url: 'https://live.staticflickr.com/65535/52119674479_1f395db297_o_d.jpg' },
    { titulo: 'Título 8', descripcion: 'Descripción 8', url: 'https://live.staticflickr.com/45/146611541_f76b7a4205_o_d.jpg' },
  ];

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

  private dialog: Dialog = inject(Dialog);

  constructor(private cdr: ChangeDetectorRef) { }

  ngAfterViewInit(): void {
    // Es importante calcular las dimensiones después de que la vista se inicialice
    // Usamos un pequeño timeout para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
      this.calculateDimensions();
      // Guardamos el estilo de transición original
      if (this.imagenesRef?.nativeElement) {
        this.transitionStyle = this.imagenesRef.nativeElement.style.transition;
      }
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
    if (!this.onlyClick) return; // Solo abre el diálogo si es un click puro
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
  }

  // --- Lógica de Arrastre (Drag) con Pointer Events ---
  onPointerDown(event: PointerEvent): void {
    // Previene el comportamiento por defecto (como seleccionar texto o arrastrar imagen fantasma)
    // event.preventDefault(); // Puede prevenir clics en botones si no se maneja bien, probar con/sin

    if (!this.imagenesRef?.nativeElement) return;

    this.onlyClick = true; // Asumimos que es un click hasta que se arrastra

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

    this.onlyClick = false; // Cambia a drag

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
      const limitedTranslateX: number = this.applyDragLimits(newTranslateX);
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
    this.applyTransform(this.lastTranslateX, true); // Anima suavemente a la posición final válida

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
  private applyTransform(translateX: number, useTransition: boolean): void {
    if (!this.imagenesRef?.nativeElement) return;
    this.imagenesRef.nativeElement.style.setProperty('--carousel-translate-x-abs', `${translateX}px`);
    this.imagenesRef.nativeElement.style.transition = useTransition ? this.transitionStyle : 'none';
    this.imagenesRef.nativeElement.style.transform = `translateX(${translateX}px)`;
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
