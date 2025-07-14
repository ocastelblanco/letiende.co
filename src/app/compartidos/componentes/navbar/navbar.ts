import { NgClass } from '@angular/common';
import { Component, computed, inject, Signal, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FirebaseStorageImage } from '@directivas/firebase-storage-image';
import { PrimengModule } from '@modulos/primeng/primeng-module';
import { BreakpointService, BreakpointSize } from '@servicios/breakpoint-service';
import { LtConfig, NavbarItem } from '@servicios/lt-config';

@Component({
  selector: 'lt-navbar',
  imports: [
    PrimengModule,
    NgClass,
    RouterModule,
    FirebaseStorageImage,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  @ViewChild('logoLT', { read: FirebaseStorageImage }) logoDirectiva!: FirebaseStorageImage;
  private config: LtConfig = inject(LtConfig);
  private breakpointServicio: BreakpointService = inject(BreakpointService);
  menuItems: NavbarItem[] = this.config.navbarItems;
  bp: Signal<BreakpointSize> = computed(() => this.breakpointServicio.getCurrentBreakpoint());
  logoActual: string = 'logo_blanco_sin_fondo';
  logo(): string {
    const logo: string = (this.bp() == 'xs' || this.bp() == 'sm') ? 'mono_naranja' : 'logo_blanco_sin_fondo';
    if (this.logoDirectiva && this.logoActual != logo) {
      this.logoDirectiva.reload();
      this.logoActual = logo;
    }
    return logo;
  }
}
