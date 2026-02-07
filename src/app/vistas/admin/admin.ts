import { ChangeDetectionStrategy, Component, inject, Signal, computed, signal, WritableSignal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PrimengModule } from '@modulos/primeng/primeng-module';
import { AuthService, UsuarioAuth } from '@core/servicios/auth.service';
import { ImagenFondo } from '@componentes/imagen-fondo';
import { MenuLateral } from '@componentes/menu-lateral/menu-lateral';
import { BreakpointService, BreakpointSize } from '@servicios/breakpoint-service';
import { LtConfig } from '@servicios/lt-config';
import { MenuCategoria } from '@servicios/datos';

@Component({
  selector: 'lt-admin',
  imports: [
    PrimengModule,
    ImagenFondo,
    MenuLateral,
    RouterLink
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class Admin {
  private readonly authService: AuthService = inject(AuthService);
  private readonly router: Router = inject(Router);
  private readonly breakpointServicio: BreakpointService = inject(BreakpointService);
  private readonly config: LtConfig = inject(LtConfig);

  readonly usuario: Signal<UsuarioAuth | null> = computed(() => this.authService.usuario());
  readonly cargando: Signal<boolean> = computed(() => this.authService.cargando());
  readonly bp: Signal<BreakpointSize> = computed(() => this.breakpointServicio.getCurrentBreakpoint());
  readonly modoTema: Signal<string> = computed(() => this.config.modoTema());
  readonly avatarError: WritableSignal<boolean> = signal<boolean>(false);

  readonly menuItems: MenuCategoria[] = [
    {
      id: 'eventos',
      nombre: 'Eventos',
      descripcion: 'Gestionar eventos del auditorio',
      icono: { nombre: 'calendar_today', tipo: 'material-symbols-outlined' },
      enlace: '/admin/eventos',
      items: []
    },
    {
      id: 'libreria',
      nombre: 'Librería',
      descripcion: 'Administrar catálogo de libros',
      icono: { nombre: 'book_2', tipo: 'material-symbols-outlined' },
      enlace: '/admin/libreria',
      items: []
    },
    {
      id: 'menu',
      nombre: 'Menú',
      descripcion: 'Actualizar menú de comidas y bebidas',
      icono: { nombre: 'fork_spoon', tipo: 'material-symbols-outlined' },
      enlace: '/admin/menu',
      items: []
    },
  ];

  async cerrarSesion(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/inicio']);
  }

  onAvatarError(): void {
    this.avatarError.set(true);
  }
}
