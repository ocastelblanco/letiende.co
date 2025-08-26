import { Component, inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { DatoMenuLateral } from '@servicios/datos';
import { Icono } from "@componentes/icono";
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { isPlatformBrowser, NgClass } from '@angular/common';
import { BreakpointSize } from '@servicios/breakpoint-service';

@Component({
  selector: 'lt-menu-lateral',
  imports: [
    Icono,
    RouterLink,
    NgClass,
  ],
  templateUrl: './menu-lateral.html',
  styleUrl: './menu-lateral.scss'
})
export class MenuLateral implements OnInit {
  @Input() datosMenu: DatoMenuLateral[] = [];
  @Input() modoTema: string = 'light';
  @Input() bp: BreakpointSize = 'xs';
  private router: Router = inject(Router);
  private platID: any = inject(PLATFORM_ID);
  url: string = '';
  menuPlegado: boolean = false;
  ngOnInit(): void {
    if (isPlatformBrowser(this.platID)) {
      this.menuPlegado = this.bp == 'xs' || this.bp == 'sm';
      this.url = this.router.url;
      this.router.events.subscribe((e: any) => {
        if (e instanceof NavigationEnd) this.url = e.url;
      });
    }
  }
  toggleMenu(): void {
    this.menuPlegado = !this.menuPlegado;
  }
}
