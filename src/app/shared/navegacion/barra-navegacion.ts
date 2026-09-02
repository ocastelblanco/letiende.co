import { ChangeDetectionStrategy, Component, ElementRef, effect, signal, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-barra-navegacion',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './barra-navegacion.html',
})
export class BarraNavegacion {
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
