import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { catchError, of } from 'rxjs';
import { PrimengModule } from '@modulos/primeng/primeng-module';
import { ImagenFondo } from '@componentes/imagen-fondo';
import { MenuLateral } from '@componentes/menu-lateral/menu-lateral';
import { BreakpointService, BreakpointSize } from '@servicios/breakpoint-service';
import { LtConfig } from '@servicios/lt-config';
import { Datos, MenuCategoria, MenuResponse } from '@servicios/datos';
import { AdminMenuService, GuardarMenuPayload } from '@core/servicios/admin-menu.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'lt-admin-menu',
  imports: [PrimengModule, ImagenFondo, MenuLateral, DecimalPipe],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-menu.html',
  styleUrl: './admin-menu.scss',
})
export class AdminMenu {
  private readonly breakpointServicio: BreakpointService = inject(BreakpointService);
  private readonly config: LtConfig = inject(LtConfig);
  private readonly datos: Datos = inject(Datos);
  private readonly adminMenuService: AdminMenuService = inject(AdminMenuService);
  private readonly messageService: MessageService = inject(MessageService);

  readonly bp: Signal<BreakpointSize> = computed(() => this.breakpointServicio.getCurrentBreakpoint());
  readonly modoTema: Signal<string> = computed(() => this.config.modoTema());
  readonly guardando: WritableSignal<boolean> = signal<boolean>(false);

  readonly menuCompleto: Signal<MenuResponse | undefined> = toSignal<MenuResponse | undefined>(
    this.datos.getMenu().pipe(catchError(() => of(undefined)))
  );

  readonly categoriasEs: Signal<MenuCategoria[]> = computed(
    () => this.menuCompleto()?.idiomas?.es?.categorias ?? []
  );

  readonly totalItems: Signal<number> = computed(
    () => this.categoriasEs().reduce((total: number, cat: MenuCategoria) => total + cat.items.length, 0)
  );

  readonly menuItemsLateral: MenuCategoria[] = [
    {
      id: 'eventos',
      nombre: 'Eventos',
      descripcion: 'Gestionar eventos del auditorio',
      icono: { nombre: 'calendar_today', tipo: 'material-symbols-outlined' },
      enlace: '/admin/eventos',
      items: [],
    },
    {
      id: 'libreria',
      nombre: 'Libreria',
      descripcion: 'Administrar catalogo de libros',
      icono: { nombre: 'book_2', tipo: 'material-symbols-outlined' },
      enlace: '/admin/libreria',
      items: [],
    },
    {
      id: 'menu',
      nombre: 'Menu',
      descripcion: 'Actualizar menu de comidas y bebidas',
      icono: { nombre: 'fork_spoon', tipo: 'material-symbols-outlined' },
      enlace: '/admin/menu',
      items: [],
    },
  ];

  guardarCambios(): void {
    const data: MenuResponse | undefined = this.menuCompleto();
    if (!data) return;

    this.guardando.set(true);

    const payload: GuardarMenuPayload = {
      seccion: 'menu',
      idiomas: data.idiomas,
      metadata: data.metadata,
    };

    this.adminMenuService.guardarMenu(payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Guardado',
          detail: 'Menú guardado exitosamente',
        });
      },
      error: () => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el menú',
        });
      },
    });
  }
}
