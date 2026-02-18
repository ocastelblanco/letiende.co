import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PrimengModule } from '@modulos/primeng/primeng-module';
import { ImagenFondo } from '@componentes/imagen-fondo';
import { MenuLateral } from '@componentes/menu-lateral/menu-lateral';
import { FormEvento } from './form-evento/form-evento';
import { BreakpointService, BreakpointSize } from '@servicios/breakpoint-service';
import { LtConfig } from '@servicios/lt-config';
import { Datos, Evento, EventosResponse, MenuCategoria } from '@servicios/datos';
import { AdminEventosService, CalendarPayload, GuardarEventosPayload } from '@core/servicios/admin-eventos.service';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'lt-admin-eventos',
  imports: [
    PrimengModule,
    ImagenFondo,
    MenuLateral,
    FormEvento,
    DatePipe,
  ],
  providers: [ConfirmationService, MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-eventos.html',
  styleUrl: './admin-eventos.scss'
})
export class AdminEventos implements OnInit {
  private readonly breakpointServicio: BreakpointService = inject(BreakpointService);
  private readonly config: LtConfig = inject(LtConfig);
  private readonly datos: Datos = inject(Datos);
  private readonly adminEventosService: AdminEventosService = inject(AdminEventosService);
  private readonly confirmationService: ConfirmationService = inject(ConfirmationService);
  private readonly messageService: MessageService = inject(MessageService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  readonly bp: Signal<BreakpointSize> = computed(() => this.breakpointServicio.getCurrentBreakpoint());
  readonly modoTema: Signal<string> = computed(() => this.config.modoTema());

  readonly eventosCompleto: WritableSignal<EventosResponse | null> = signal<EventosResponse | null>(null);
  readonly cargando: WritableSignal<boolean> = signal<boolean>(true);
  readonly guardando: WritableSignal<boolean> = signal<boolean>(false);
  readonly dialogoVisible: WritableSignal<boolean> = signal<boolean>(false);
  readonly eventoEditando: WritableSignal<{ es: Evento; en: Evento } | null> = signal<{ es: Evento; en: Evento } | null>(null);
  readonly modoFormulario: WritableSignal<'crear' | 'editar'> = signal<'crear' | 'editar'>('crear');

  readonly eventosLista: Signal<Evento[]> = computed(() => {
    const data: EventosResponse | null = this.eventosCompleto();
    if (!data?.idiomas?.es?.eventos) return [];
    return data.idiomas.es.eventos;
  });

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
      nombre: 'Libreria',
      descripcion: 'Administrar catalogo de libros',
      icono: { nombre: 'book_2', tipo: 'material-symbols-outlined' },
      enlace: '/admin/libreria',
      items: []
    },
    {
      id: 'menu',
      nombre: 'Menu',
      descripcion: 'Actualizar menu de comidas y bebidas',
      icono: { nombre: 'fork_spoon', tipo: 'material-symbols-outlined' },
      enlace: '/admin/menu',
      items: []
    },
  ];

  ngOnInit(): void {
    this.datos.getEventos().subscribe({
      next: (response: EventosResponse) => {
        this.eventosCompleto.set(response);
        this.cargando.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los eventos',
        });
        this.cdr.detectChanges();
      },
    });
  }

  abrirCrear(): void {
    this.eventoEditando.set(null);
    this.modoFormulario.set('crear');
    this.dialogoVisible.set(true);
  }

  abrirEditar(id: string): void {
    const data: EventosResponse | null = this.eventosCompleto();
    if (!data?.idiomas?.es?.eventos || !data?.idiomas?.en?.eventos) return;

    const eventoEs: Evento | undefined = data.idiomas.es.eventos.find((e: Evento) => e.id === id);
    const eventoEn: Evento | undefined = data.idiomas.en.eventos.find((e: Evento) => e.id === id);

    if (eventoEs && eventoEn) {
      this.eventoEditando.set({ es: eventoEs, en: eventoEn });
      this.modoFormulario.set('editar');
      this.dialogoVisible.set(true);
    }
  }

  guardarEvento(evento: { es: Evento; en: Evento }): void {
    const data: EventosResponse | null = this.eventosCompleto();

    this.guardando.set(true);
    const esCrear: boolean = this.modoFormulario() === 'crear';

    // Si no hay datos previos o la estructura está incompleta, crear estructura base
    const eventosEs: Evento[] = [...(data?.idiomas?.es?.eventos || [])];
    const eventosEn: Evento[] = [...(data?.idiomas?.en?.eventos || [])];

    if (esCrear) {
      eventosEs.push(evento.es);
      eventosEn.push(evento.en);
    } else {
      const indiceEs: number = eventosEs.findIndex((e: Evento) => e.id === evento.es.id);
      const indiceEn: number = eventosEn.findIndex((e: Evento) => e.id === evento.en.id);
      if (indiceEs !== -1) eventosEs[indiceEs] = evento.es;
      if (indiceEn !== -1) eventosEn[indiceEn] = evento.en;
    }

    const nuevosDatos: EventosResponse = {
      seccion: data?.seccion || 'eventos',
      idiomas: {
        es: {
          titulo: data?.idiomas?.es?.titulo || 'Eventos',
          descripcion: data?.idiomas?.es?.descripcion || 'Cartelera de eventos de Le Teatre',
          eventos: eventosEs,
        },
        en: {
          titulo: data?.idiomas?.en?.titulo || 'Events',
          descripcion: data?.idiomas?.en?.descripcion || 'Le Teatre event lineup',
          eventos: eventosEn,
        },
      },
      metadata: data?.metadata,
      timestamp: data?.timestamp,
    };

    const payload: GuardarEventosPayload = {
      seccion: 'eventos',
      idiomas: nuevosDatos.idiomas,
      metadata: nuevosDatos.metadata,
    };

    this.adminEventosService.guardarEventos(payload).subscribe({
      next: () => {
        this.eventosCompleto.set(nuevosDatos);
        this.dialogoVisible.set(false);
        this.guardando.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Guardado',
          detail: esCrear ? 'Evento creado exitosamente' : 'Evento actualizado exitosamente',
        });

        // Sincronizar con Google Calendar
        const calendarPayload: CalendarPayload = {
          accion: esCrear ? 'crear' : 'editar',
          evento: {
            id: evento.es.id,
            titulo: evento.es.titulo,
            descripcion: evento.es.descripcion,
            fecha_inicio: evento.es.fecha_inicio,
            fecha_fin: evento.es.fecha_fin,
            ubicacion: evento.es.ubicacion,
          },
        };

        this.adminEventosService.sincronizarConCalendario(calendarPayload).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'info',
              summary: 'Calendario',
              detail: esCrear ? 'Evento creado en Google Calendar' : 'Evento actualizado en Google Calendar',
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'warn',
              summary: 'Calendario',
              detail: 'No se pudo sincronizar con Google Calendar',
            });
          },
        });

        this.cdr.detectChanges();
      },
      error: () => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el evento',
        });
        this.cdr.detectChanges();
      },
    });
  }

  confirmarEliminar(id: string): void {
    this.confirmationService.confirm({
      message: 'Esta seguro de eliminar este evento? Esta accion no se puede deshacer.',
      header: 'Confirmar eliminacion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminarEvento(id),
    });
  }

  private eliminarEvento(id: string): void {
    const data: EventosResponse | null = this.eventosCompleto();
    if (!data) return;

    this.guardando.set(true);

    const nuevosDatos: EventosResponse = {
      ...data,
      idiomas: {
        es: {
          ...data.idiomas.es,
          eventos: data.idiomas.es.eventos.filter((e: Evento) => e.id !== id),
        },
        en: {
          ...data.idiomas.en,
          eventos: data.idiomas.en.eventos.filter((e: Evento) => e.id !== id),
        },
      },
    };

    const payload: GuardarEventosPayload = {
      seccion: 'eventos',
      idiomas: nuevosDatos.idiomas,
      metadata: nuevosDatos.metadata,
    };

    this.adminEventosService.guardarEventos(payload).subscribe({
      next: () => {
        this.eventosCompleto.set(nuevosDatos);
        this.guardando.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Evento eliminado exitosamente',
        });

        // Eliminar de Google Calendar
        this.adminEventosService.eliminarDeCalendario(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'info',
              summary: 'Calendario',
              detail: 'Evento eliminado de Google Calendar',
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'warn',
              summary: 'Calendario',
              detail: 'No se pudo eliminar de Google Calendar',
            });
          },
        });

        this.cdr.detectChanges();
      },
      error: () => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el evento',
        });
        this.cdr.detectChanges();
      },
    });
  }

  cerrarDialogo(): void {
    this.dialogoVisible.set(false);
  }
}
