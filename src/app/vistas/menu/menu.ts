import { ChangeDetectorRef, Component, computed, effect, inject, OnInit, Signal } from '@angular/core';
import { ImagenFondo } from '@componentes/imagen-fondo';
import { IconosModule } from '@modulos/iconos/iconos-module';
import { PrimengModule } from '@modulos/primeng/primeng-module';
import { LtConfig } from '@servicios/lt-config';
import { MetaService } from '@servicios/meta';
import { BreakpointService, BreakpointSize } from '@servicios/breakpoint-service';
import { NgClass } from '@angular/common';
import { MenuLateral } from "@componentes/menu-lateral/menu-lateral";
import { DatoMenuLateral, Datos } from '@servicios/datos';

@Component({
  selector: 'lt-menu',
  imports: [
    PrimengModule,
    IconosModule,
    ImagenFondo,
    NgClass,
    MenuLateral
  ],
  templateUrl: './menu.html',
  styleUrl: './menu.scss'
})
export class Menu implements OnInit {
  private config: LtConfig = inject(LtConfig);
  private meta: MetaService = inject(MetaService);
  private breakpointServicio: BreakpointService = inject(BreakpointService);
  private datos: Datos = inject(Datos);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  bp: Signal<BreakpointSize> = computed(() => this.breakpointServicio.getCurrentBreakpoint());
  idioma: Signal<string> = computed(() => this.config.idioma());
  modoTema: string = 'light';
  datosMenu: DatoMenuLateral[] = [];
  constructor() {
    effect(() => this.modoTema = this.config.modoTema()); // Efecto para reaccionar a cambios en el modo de tema
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
    this.datos.getMenu().subscribe((datos: DatoMenuLateral[]) => {
      this.datosMenu = datos;
      this.cdr.detectChanges();
    });
  }
}
