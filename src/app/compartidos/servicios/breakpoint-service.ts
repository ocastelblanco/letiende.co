import { Injectable, WritableSignal, signal, OnDestroy } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';

export type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Injectable({
  providedIn: 'root'
})
export class BreakpointService implements OnDestroy {
  private destroy$ = new Subject<void>();

  // Signal que contiene el breakpoint actual
  public readonly currentBreakpoint: WritableSignal<BreakpointSize> = signal<BreakpointSize>('lg');

  // Mapeo de breakpoints del Angular CDK a nuestros valores
  private readonly breakpointMap = {
    [Breakpoints.XSmall]: 'xs' as const,
    [Breakpoints.Small]: 'sm' as const,
    [Breakpoints.Medium]: 'md' as const,
    [Breakpoints.Large]: 'lg' as const,
    [Breakpoints.XLarge]: 'xl' as const
  };

  constructor(private breakpointObserver: BreakpointObserver) {
    this.initializeBreakpointObserver();
  }

  private initializeBreakpointObserver(): void {
    // Observar todos los breakpoints disponibles
    const breakpoints = Object.keys(this.breakpointMap);

    this.breakpointObserver
      .observe(breakpoints)
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        // Encontrar el breakpoint que coincide actualmente
        const matchedBreakpoint = Object.entries(result.breakpoints)
          .find(([_, isMatched]) => isMatched)?.[0];

        if (matchedBreakpoint && matchedBreakpoint in this.breakpointMap) {
          const newBreakpoint = this.breakpointMap[matchedBreakpoint as keyof typeof this.breakpointMap];
          this.currentBreakpoint.set(newBreakpoint);
        }
      });
  }

  /**
   * Obtiene el breakpoint actual de forma síncrona
   * @returns El breakpoint actual
   */
  getCurrentBreakpoint(): BreakpointSize {
    return this.currentBreakpoint();
  }

  /**
   * Verifica si el breakpoint actual coincide con el especificado
   * @param breakpoint El breakpoint a verificar
   * @returns true si coincide, false en caso contrario
   */
  isBreakpoint(breakpoint: BreakpointSize): boolean {
    return this.currentBreakpoint() === breakpoint;
  }

  /**
   * Verifica si el breakpoint actual es menor o igual al especificado
   * @param breakpoint El breakpoint a verificar
   * @returns true si es menor o igual, false en caso contrario
   */
  isBreakpointDown(breakpoint: BreakpointSize): boolean {
    const order: BreakpointSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    const currentIndex = order.indexOf(this.currentBreakpoint());
    const targetIndex = order.indexOf(breakpoint);
    return currentIndex <= targetIndex;
  }

  /**
   * Verifica si el breakpoint actual es mayor o igual al especificado
   * @param breakpoint El breakpoint a verificar
   * @returns true si es mayor o igual, false en caso contrario
   */
  isBreakpointUp(breakpoint: BreakpointSize): boolean {
    const order: BreakpointSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    const currentIndex = order.indexOf(this.currentBreakpoint());
    const targetIndex = order.indexOf(breakpoint);
    return currentIndex >= targetIndex;
  }

  /**
   * Verifica si el breakpoint actual está en el rango de móvil (xs, sm)
   * @returns true si está en móvil, false en caso contrario
   */
  isMobile(): boolean {
    return this.isBreakpoint('xs') || this.isBreakpoint('sm');
  }

  /**
   * Verifica si el breakpoint actual está en el rango de tablet (md)
   * @returns true si está en tablet, false en caso contrario
   */
  isTablet(): boolean {
    return this.isBreakpoint('md');
  }

  /**
   * Verifica si el breakpoint actual está en el rango de desktop (lg, xl)
   * @returns true si está en desktop, false en caso contrario
   */
  isDesktop(): boolean {
    return this.isBreakpoint('lg') || this.isBreakpoint('xl');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}