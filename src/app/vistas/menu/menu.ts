import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, inject, OnInit, Signal, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ImagenFondo } from '@componentes/imagen-fondo';
import { PrimengModule } from '@modulos/primeng/primeng-module';
import { LtConfig } from '@servicios/lt-config';
import { MetaService } from '@servicios/meta';
import { BreakpointService, BreakpointSize } from '@servicios/breakpoint-service';
import { MenuLateral } from "@componentes/menu-lateral/menu-lateral";
import { Datos, MenuCategoria, MenuIdioma, MenuResponse } from '@servicios/datos';

@Component({
  selector: 'lt-menu',
  imports: [PrimengModule, ImagenFondo, MenuLateral, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './menu.html',
  styleUrl: './menu.scss'
})
export class Menu implements OnInit {
  private readonly config: LtConfig = inject(LtConfig);
  private readonly meta: MetaService = inject(MetaService);
  private readonly breakpointServicio: BreakpointService = inject(BreakpointService);
  private readonly datos: Datos = inject(Datos);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  readonly bp: Signal<BreakpointSize> = computed(() => this.breakpointServicio.getCurrentBreakpoint());
  readonly idioma: Signal<string> = computed(() => this.config.idioma());
  readonly modoTema = signal<string>('light');
  readonly menuCompleto = signal<MenuResponse | null>(null);
  readonly menuIdioma = computed<MenuIdioma | null>(() => {
    const menu: MenuResponse | null = this.menuCompleto();
    if (!menu) return null;
    const idioma: string = this.idioma().toLowerCase();
    return idioma === 'es' ? menu.idiomas.es : menu.idiomas.en;
  });
  readonly datosMenuLateral = computed<MenuCategoria[]>(() => {
    const menuData: MenuIdioma | null = this.menuIdioma();
    if (!menuData) return [];
    return menuData.categorias;
  });

  constructor() {
    effect(() => this.modoTema.set(this.config.modoTema())); // Efecto para reaccionar a cambios en el modo de tema
  }

  ngOnInit(): void {
    this.meta.updatePageMeta({
      title: 'Menú Le Tiende',
      description: 'Disfruta de nuestro menú para acompañar tus mejores momentos en Le Tiende.',
      keywords: 'café,empanadas,hamburguesas,tortas,pastelería,cocteles,licores,Le Tiende,parkway,Bogotá',
      image: 'https://assets.letiende.co/logos/logo_sobre_amarillo_sin_fondo.png',
      url: 'https://letiende.co',
      type: 'website',
      siteName: 'Le Tiende',
      canonical: 'https://letiende.co/menu',
      noindex: false,
      nofollow: false,
    });
    this.datos.getMenu().subscribe((menuResponse: MenuResponse) => {
      this.menuCompleto.set(menuResponse);
      this.cdr.detectChanges();
    });
  }
}
