import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PrimengModule } from '@modulos/primeng/primeng-module';
import { BreakpointService, BreakpointSize } from '@servicios/breakpoint-service';
import { IdiomaItem, LtConfig, NavbarItem } from '@servicios/lt-config';

@Component({
  selector: 'lt-navbar',
  imports: [
    PrimengModule,
    RouterModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  private readonly config: LtConfig = inject(LtConfig);
  private readonly breakpointServicio: BreakpointService = inject(BreakpointService);

  readonly menuItems: NavbarItem[] = this.config.navbarItems;
  readonly bp: Signal<BreakpointSize> = computed(() => this.breakpointServicio.getCurrentBreakpoint());
  readonly modoTema: Signal<string> = computed(() => this.config.modoTema());
  logoActual: string = 'logo_negro_sin_fondo';
  readonly iconoTema: Signal<string> = computed(() => this.config.iconosTema[this.config.modoTema()]);
  readonly idioma: Signal<string> = computed(() => this.config.idioma());
  readonly idiomaMenuItems: IdiomaItem[] = this.config.idiomaItems.map((item: IdiomaItem) => {
    return {
      ...item,
      command: () => this.cambiarIdioma(item)
    };
  });
  readonly cdn: string = this.config.cdnUrl;

  logo(): string {
    const logoTema: string = (this.modoTema() === 'light') ? 'logo_negro_sin_fondo' : 'logo_blanco_sin_fondo';
    const logo: string = (this.bp() === 'xs' || this.bp() === 'sm') ? 'mono_naranja' : logoTema;
    if (this.logoActual !== logo) {
      this.logoActual = logo;
    }
    return logo;
  }

  cambiarTema(): void {
    const element: HTMLElement = document.querySelector('html') as HTMLElement;
    element.classList.toggle('tema-oscuro');
    this.config.modoTema.set(this.config.modoTema() === 'light' ? 'dark' : 'light');
  }

  idiomaActual(): { flag: string, label: string } {
    const idiomaActual: IdiomaItem = this.idiomaMenuItems.find((item: IdiomaItem) => item.label === this.idioma()) || { flag: '', label: '' };
    return { flag: idiomaActual.flag, label: idiomaActual.label as string };
  }

  cambiarIdioma(item: IdiomaItem): void {
    if (this.idiomaActual().label !== item.label) {
      console.log('Cambiamos el idioma a ' + item.label);
      this.config.idioma.set(item.label as string);
    }
  }
}
