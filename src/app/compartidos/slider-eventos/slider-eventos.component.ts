import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { DataService, Evento } from 'src/app/servicios/data.service';
import { Subscription, interval, Subject, fromEvent } from 'rxjs';
import { takeUntil, debounceTime, switchMap, takeWhile } from 'rxjs/operators';

@Component({
  selector: 'lt-slider-eventos',
  templateUrl: './slider-eventos.component.html',
  styleUrls: ['./slider-eventos.component.scss'] // Asegúrate que sea styleUrls (plural)
})
export class SliderEventosComponent implements OnInit, AfterViewInit, OnDestroy {
  // Referencia al contenedor de los eventos en el template
  @ViewChild('eventosContainer') eventosContainerRef!: ElementRef<HTMLDivElement>;
  eventos: Evento[] = [];

  // Subject para limpiar suscripciones al destruir el componente
  private destroy$ = new Subject<void>();
  // Suscripción al intervalo de auto-deslizamiento
  private autoSlideSubscription: Subscription | null = null;
  // Timeout para reanudar el auto-deslizamiento
  private resumeTimeout: ReturnType<typeof setTimeout> | null = null;

  // Estado del arrastre
  private isDragging = false;
  private startX = 0; // Posición X inicial del puntero/dedo
  private currentTranslate = 0; // Valor actual de translateX
  private startTranslate = 0; // Valor de translateX al iniciar el arrastre

  // Dimensiones calculadas (se calculan en ngAfterViewInit/setupSlider)
  private itemWidth = 0;
  private containerWidth = 0;
  private totalContentWidth = 0;
  private gap = 0;

  // Constantes de configuración
  private readonly AUTO_SLIDE_INTERVAL_MS = 2000; // 2 segundos
  private readonly RESUME_DELAY_MS = 5000; // 5 segundos
  private readonly SMOOTH_TRANSITION = 'transform 0.5s ease-out';
  private readonly NO_TRANSITION = 'transform 0s'; // Para arrastre inmediato

  constructor(
    private data: DataService,
    private elRef: ElementRef<HTMLElement>, // Referencia al elemento host del componente
    private cdRef: ChangeDetectorRef,       // Para detectar cambios si los datos llegan tarde
    private ngZone: NgZone                  // Para optimizar rendimiento con eventos
  ) { }

  ngOnInit(): void {
    this.data.getEventos()
      .pipe(takeUntil(this.destroy$)) // Se desuscribe automáticamente al destruir
      .subscribe((eventos: Evento[]) => {
        if (eventos.length > 0) {
          // Ordena los eventos por fecha
          this.eventos = eventos.sort((a: Evento, b: Evento) => {
            return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
          });
          // Forzamos detección de cambios por si la vista ya se inicializó
          this.cdRef.detectChanges();
          // Configuramos el slider DESPUÉS de que el DOM se actualice con los nuevos eventos
          this.ngZone.runOutsideAngular(() => {
            requestAnimationFrame(() => this.setupSlider());
          });
        } else {
          this.eventos = []; // Asegura que esté vacío si no hay eventos
          this.stopAutoSlide(); // Detiene el slider si no hay items
        }
      });
  }

  ngAfterViewInit(): void {
    // Configuración inicial si los datos ya estaban al inicializar la vista
    if (this.eventos.length > 0) {
      this.ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => this.setupSlider());
      });
    }

    // Escucha cambios de tamaño de ventana para recalcular dimensiones
    this.ngZone.runOutsideAngular(() => {
      fromEvent(window, 'resize')
        .pipe(
          debounceTime(300), // Espera 300ms después del último evento resize
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          console.log('Window resized, setting up slider again');
          this.setupSlider();
        });
    });
  }

  ngOnDestroy(): void {
    // Limpia todas las suscripciones y timeouts
    this.destroy$.next();
    this.destroy$.complete();
    this.stopAutoSlide();
    if (this.resumeTimeout) {
      clearTimeout(this.resumeTimeout);
    }
    // No es necesario remover listeners de fromEvent manualmente si se usa takeUntil(this.destroy$)
  }

  /** Configura las dimensiones iniciales y los listeners */
  private setupSlider(): void {
    this.stopAutoSlide(); // Detiene cualquier deslizamiento anterior
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout); // Cancela reanudación pendiente
    this.currentTranslate = 0; // Resetea posición

    const containerElement = this.eventosContainerRef?.nativeElement;
    const hostElement = this.elRef.nativeElement;
    if (!containerElement || !hostElement || this.eventos.length === 0) {
      console.warn('Slider setup skipped: container, host or items not ready.');
      return;
    }

    const firstItem = containerElement.querySelector('.evento') as HTMLElement;
    if (!firstItem) {
      console.warn('Slider setup skipped: no ".evento" items found.');
      return;
    }

    // Calcula dimensiones
    this.containerWidth = hostElement.offsetWidth;
    this.itemWidth = firstItem.offsetWidth;
    this.gap = parseFloat(getComputedStyle(containerElement).gap) || 0;
    const itemWidthWithGap = this.itemWidth + this.gap;
    // Ancho total = (num_items * ancho_con_gap) - un_gap_final
    this.totalContentWidth = (this.eventos.length * itemWidthWithGap) - this.gap;

    console.log(`Setup: containerW=${this.containerWidth}, itemW=${this.itemWidth}, gap=${this.gap}, totalW=${this.totalContentWidth}`);

    // Aplica estilos iniciales
    containerElement.style.transition = this.SMOOTH_TRANSITION;
    this.applyTransform(0); // Posición inicial

    // Habilita drag & auto-slide solo si el contenido excede el contenedor
    if (this.totalContentWidth > this.containerWidth) {
      containerElement.style.cursor = 'grab'; // Indica que se puede arrastrar
      this.setupDragListeners();
      this.startAutoSlide();
    } else {
      containerElement.style.cursor = 'default'; // No se puede arrastrar
      // Podríamos querer remover listeners aquí si se añadieron previamente
      console.log('Content does not overflow, auto-slide and drag disabled.');
    }
  }

  /** Configura los listeners para el arrastre (mouse y touch) */
  private setupDragListeners(): void {
    const containerElement = this.eventosContainerRef.nativeElement;

    // Ejecuta listeners fuera de la zona de Angular para mejor rendimiento
    this.ngZone.runOutsideAngular(() => {

      // --- Eventos de Mouse ---
      const mouseDown$ = fromEvent<MouseEvent>(containerElement, 'mousedown');
      const mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove'); // Escucha en document
      const mouseUp$ = fromEvent<MouseEvent>(document, 'mouseup');     // Escucha en document

      mouseDown$.pipe(
        takeUntil(this.destroy$),
        switchMap((startEvent: MouseEvent) => {
          // Previene el comportamiento por defecto (ej: seleccionar texto)
          startEvent.preventDefault();
          this.onDragStart(startEvent.clientX, containerElement);
          // Escucha movimientos SÓLO mientras el botón esté presionado
          return mouseMove$.pipe(
            takeUntil(mouseUp$), // Deja de escuchar move al soltar el botón
            takeUntil(this.destroy$) // Deja de escuchar si el componente se destruye
          );
        })
      ).subscribe((moveEvent: MouseEvent) => {
        this.onDragMove(moveEvent.clientX, containerElement);
      });

      // Maneja el final del arrastre (cuando se suelta el botón)
      mouseUp$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.onDragEnd(containerElement);
      });

      // Maneja si el cursor sale de la ventana mientras arrastra
      fromEvent<MouseEvent>(document, 'mouseleave')
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (this.isDragging) {
            this.onDragEnd(containerElement);
          }
        });

      // --- Eventos Táctiles ---
      const touchStart$ = fromEvent<TouchEvent>(containerElement, 'touchstart', { passive: true }); // passive:true mejora scroll
      const touchMove$ = fromEvent<TouchEvent>(document, 'touchmove');
      const touchEnd$ = fromEvent<TouchEvent>(document, 'touchend');
      const touchCancel$ = fromEvent<TouchEvent>(document, 'touchcancel');

      touchStart$.pipe(
        takeUntil(this.destroy$),
        switchMap((startEvent: TouchEvent) => {
          // No usamos preventDefault en touchstart aquí para permitir scroll vertical si es necesario
          this.onDragStart(startEvent.touches[0].clientX, containerElement);
          return touchMove$.pipe(
            takeUntil(touchEnd$),
            takeUntil(touchCancel$),
            takeUntil(this.destroy$)
          );
        })
      ).subscribe((moveEvent: TouchEvent) => {
        this.onDragMove(moveEvent.touches[0].clientX, containerElement);
      });

      // Maneja el final del arrastre táctil
      touchEnd$.pipe(takeUntil(this.destroy$)).subscribe(() => this.onDragEnd(containerElement));
      touchCancel$.pipe(takeUntil(this.destroy$)).subscribe(() => this.onDragEnd(containerElement));

      // Previene el arrastre nativo de imágenes/links dentro del slider
      fromEvent<DragEvent>(containerElement, 'dragstart')
        .pipe(takeUntil(this.destroy$))
        .subscribe(event => event.preventDefault());
    });
  }

  /** Inicia el arrastre */
  private onDragStart(clientX: number, element: HTMLElement): void {
    if (this.totalContentWidth <= this.containerWidth) return; // No arrastrar si no hay overflow

    this.isDragging = true;
    this.startX = clientX;
    this.startTranslate = this.currentTranslate; // Guarda la posición actual
    this.stopAutoSlide(); // Pausa el deslizamiento automático
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout); // Cancela la reanudación

    element.style.transition = this.NO_TRANSITION; // Transición instantánea durante arrastre
    element.style.cursor = 'grabbing'; // Cambia el cursor
    document.body.style.userSelect = 'none'; // Evita seleccionar texto fuera
  }

  /** Actualiza la posición durante el arrastre */
  private onDragMove(clientX: number, element: HTMLElement): void {
    if (!this.isDragging) return;

    const currentX = clientX;
    const diffX = currentX - this.startX; // Diferencia desde el inicio del arrastre
    let newTranslate = this.startTranslate + diffX;

    // Límites (no permitir arrastrar más allá del contenido)
    const maxTranslate = 0; // Límite izquierdo
    const minTranslate = -(this.totalContentWidth - this.containerWidth); // Límite derecho

    // Opcional: Añadir resistencia al pasar los límites
    if (newTranslate > maxTranslate) {
      newTranslate = maxTranslate + (newTranslate - maxTranslate) * 0.3; // Atenuación
    } else if (newTranslate < minTranslate) {
      newTranslate = minTranslate + (newTranslate - minTranslate) * 0.3; // Atenuación
    }

    this.currentTranslate = newTranslate;
    this.applyTransform(this.currentTranslate);
  }

  /** Finaliza el arrastre */
  private onDragEnd(element: HTMLElement): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    element.style.transition = this.SMOOTH_TRANSITION; // Restaura transición suave
    element.style.cursor = 'grab'; // Restaura cursor
    document.body.style.userSelect = ''; // Restaura selección de texto

    // Ajusta a los límites si se soltó más allá
    const maxTranslate = 0;
    const minTranslate = -(this.totalContentWidth - this.containerWidth);

    if (this.currentTranslate > maxTranslate) {
      this.currentTranslate = maxTranslate;
    } else if (this.currentTranslate < minTranslate) {
      // Asegura que el mínimo sea 0 si no hay overflow (aunque no debería llegarse aquí)
      this.currentTranslate = Math.max(minTranslate, 0);
    }

    this.applyTransform(this.currentTranslate); // Aplica la posición final ajustada

    // Programa la reanudación del auto-deslizamiento
    this.scheduleResumeAutoSlide();
  }

  /** Inicia el deslizamiento automático */
  private startAutoSlide(): void {
    this.stopAutoSlide(); // Asegura que no haya intervalos duplicados

    // No iniciar si el contenido no excede el contenedor
    if (this.totalContentWidth <= this.containerWidth) {
      return;
    }

    const containerElement = this.eventosContainerRef.nativeElement;
    containerElement.style.transition = this.SMOOTH_TRANSITION; // Asegura transición suave

    this.autoSlideSubscription = interval(this.AUTO_SLIDE_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.ngZone.runOutsideAngular(() => { // Ejecuta la lógica del intervalo fuera de Angular
          const itemWidthWithGap = this.itemWidth + this.gap;
          let nextTranslate = this.currentTranslate - itemWidthWithGap;

          // Límite derecho (posición más a la izquierda posible)
          const minTranslate = -(this.totalContentWidth - this.containerWidth);

          // Si el siguiente paso se pasa del final, vuelve al principio
          if (nextTranslate < minTranslate) {
            nextTranslate = 0; // Vuelve al inicio
            // Opcional: transición diferente para el loop
            // containerElement.style.transition = 'transform 0.8s ease-in-out';
          } else {
            containerElement.style.transition = this.SMOOTH_TRANSITION; // Transición normal
          }

          this.currentTranslate = nextTranslate;
          this.applyTransform(this.currentTranslate);

          // Si cambiamos la transición para el loop, la restauramos después de un pequeño delay
          // if (containerElement.style.transition !== this.SMOOTH_TRANSITION) {
          //   setTimeout(() => {
          //     if (!this.isDragging) { // Solo si no estamos arrastrando
          //        containerElement.style.transition = this.SMOOTH_TRANSITION;
          //     }
          //   }, 50); // Ajustar si es necesario
          // }
        });
      });
  }

  /** Detiene el deslizamiento automático */
  private stopAutoSlide(): void {
    if (this.autoSlideSubscription) {
      this.autoSlideSubscription.unsubscribe();
      this.autoSlideSubscription = null;
    }
  }

  /** Programa la reanudación del deslizamiento automático después de un retraso */
  private scheduleResumeAutoSlide(): void {
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout); // Limpia timeout anterior
    // Solo reanuda si el contenido sigue excediendo el contenedor
    if (this.totalContentWidth > this.containerWidth) {
      this.resumeTimeout = setTimeout(() => {
        this.ngZone.runOutsideAngular(() => { // Inicia el auto-slide fuera de Angular
          this.startAutoSlide();
        });
      }, this.RESUME_DELAY_MS);
    }
  }

  /** Aplica la transformación translateX al contenedor */
  private applyTransform(value: number): void {
    // Usamos requestAnimationFrame para asegurar que el navegador aplique el cambio
    // de forma eficiente, especialmente durante el arrastre rápido.
    requestAnimationFrame(() => {
      if (this.eventosContainerRef?.nativeElement) {
        this.eventosContainerRef.nativeElement.style.transform = `translateX(${value}px)`;
      }
    });
  }

  /** Manejador de clic en un evento (se mantiene igual) */
  abreEvento(index: number): void {
    // Podríamos añadir una lógica para evitar abrir si fue un arrastre reciente,
    // pero por ahora lo dejamos como estaba.
    if (this.isDragging) {
      console.log('Drag detected, preventing click action on index:', index);
      return; // Evita la acción si se estaba arrastrando
    }
    console.log('Abre evento ' + index);
    // Aquí iría la lógica para mostrar detalles del evento
  }
}
