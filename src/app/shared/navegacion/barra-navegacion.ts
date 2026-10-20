import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  REQUEST,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CARTA_PUBLICADA_TOKEN, cartaVisible, resolverHostCarta } from '@core/carta-visibilidad';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-barra-navegacion',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './barra-navegacion.html',
})
export class BarraNavegacion {
  // Mismo criterio que la ruta /carta (ADR-024): sin enlace a un 404.
  protected readonly cartaVisible = cartaVisible(
    resolverHostCarta(inject(REQUEST, { optional: true })),
    inject(CARTA_PUBLICADA_TOKEN),
  );
  // "Carta" es un enlace normal (carga completa), no `routerLink`: la carta
  // solo la arma el servidor y llega al navegador por TransferState, así que una
  // navegación interna la dejaba sin datos ("La carta no está disponible…").
  // Por eso el resaltado de enlace activo lo calcula este componente.
  private readonly router = inject(Router);
  protected readonly enCarta = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map(() => this.router.url.split(/[?#]/)[0] === '/carta'),
    ),
    { initialValue: false },
  );
  protected readonly menuAbierto = signal(false);

  private readonly botonMenu = viewChild<ElementRef<HTMLButtonElement>>('botonMenu');
  private readonly botonCerrar = viewChild<ElementRef<HTMLButtonElement>>('botonCerrar');

  constructor() {
    // Cuando el panel móvil se abre, el foco pasa a su botón de cierre —
    // sin esto, Tab seguiría recorriendo el contenido tapado detrás del overlay.
    effect(() => {
      if (this.menuAbierto()) {
        this.botonCerrar()?.nativeElement.focus();
      }
    });
  }

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    if (!this.menuAbierto()) return;
    this.menuAbierto.set(false);
    this.botonMenu()?.nativeElement.focus();
  }
}
