import { ChangeDetectionStrategy, Component, inject, input, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { MenuCategoria } from '@servicios/datos';
import { Icono } from "@componentes/icono";
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { BreakpointSize } from '@servicios/breakpoint-service';

@Component({
  selector: 'lt-menu-lateral',
  imports: [Icono, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './menu-lateral.html',
  styleUrl: './menu-lateral.scss'
})
export class MenuLateral implements OnInit {
  readonly datosMenu = input<MenuCategoria[]>([]);
  readonly modoTema = input<string>('light');
  readonly bp = input<BreakpointSize>('xs');

  private readonly router: Router = inject(Router);
  private readonly platID: object = inject(PLATFORM_ID);

  readonly url = signal<string>('');
  readonly menuPlegado = signal<boolean>(false);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platID)) {
      this.menuPlegado.set(this.bp() === 'xs' || this.bp() === 'sm');
      this.url.set(this.router.url);
      this.router.events.subscribe((e: unknown) => {
        if (e instanceof NavigationEnd) {
          this.url.set(e.url);
        }
      });
    }
  }

  toggleMenu(): void {
    this.menuPlegado.update(plegado => !plegado);
  }
}
