import { ChangeDetectionStrategy, Component, input, output, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PrimengModule } from '@modulos/primeng/primeng-module';
import { Evento, EventoArtista, EventoPrecio, FormaPagoItem } from '@servicios/datos';

interface OpcionSelect {
  label: string;
  value: string;
}

@Component({
  selector: 'lt-form-evento',
  imports: [ReactiveFormsModule, ...PrimengModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './form-evento.html',
  styleUrl: './form-evento.scss'
})
export class FormEvento implements OnInit {
  readonly eventoEditando = input<{ es: Evento; en: Evento } | null>(null);
  readonly modoFormulario = input<'crear' | 'editar'>('crear');
  readonly guardar = output<{ es: Evento; en: Evento }>();
  readonly cancelar = output<void>();

  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly http: HttpClient = inject(HttpClient);

  formEvento!: FormGroup;
  fechaMinFin: WritableSignal<Date | null> = signal(null);

  readonly opcionesMediaTipo: OpcionSelect[] = [
    { label: 'Imagen', value: 'image' },
    { label: 'Video', value: 'video' },
  ];

  readonly opcionesFormaPago: { tipo: FormaPagoItem['tipo']; label: string; requiereTelefono: boolean }[] = [
    { tipo: 'atrapalo', label: 'Atrápalo', requiereTelefono: false },
    { tipo: 'letiende', label: 'Le Tiende', requiereTelefono: false },
    { tipo: 'whatsapp', label: 'Al WhatsApp', requiereTelefono: true },
    { tipo: 'telefono', label: 'Al teléfono', requiereTelefono: true },
  ];

  readonly opcionesTipoVenta: OpcionSelect[] = [
    { label: 'Preventa', value: 'preventa' },
    { label: 'Día del evento', value: 'dia_evento' },
  ];

  sugerenciasCategorias: string[] = [];
  categoriasFiltradas: string[] = [];

  ngOnInit(): void {
    this.construirFormulario();
    this.http.get<{ categorias: string[] }>('/categorias.json').subscribe({
      next: (data: { categorias: string[] }) => {
        this.sugerenciasCategorias = data.categorias;
      },
    });
    const evento: { es: Evento; en: Evento } | null = this.eventoEditando();
    if (evento) {
      this.cargarEvento(evento);
    }
  }

  private construirFormulario(): void {
    this.formEvento = this.fb.group({
      id: [this.generarId()],
      fecha_inicio: [null as Date | null, Validators.required],
      fecha_fin: [null as Date | null, Validators.required],
      ubicacion: ['', Validators.required],
      media_id: ['', Validators.required],
      media_tipo: ['image', Validators.required],
      forma_pago: this.fb.array(
        this.opcionesFormaPago.map((op: { tipo: FormaPagoItem['tipo']; label: string; requiereTelefono: boolean }) => this.fb.group({
          activo: [false],
          tipo: [op.tipo],
          telefono: [''],
        }))
      ),
      capacidad: [100, [Validators.required, Validators.min(1)]],
      entradas_disponibles: [100, [Validators.required, Validators.min(0)]],
      enlace_boletas: [''],
      enlace_instagram: [''],
      enlace_tiktok: [''],
      enlace_web: [''],
      codigo_pulep: [''],
      categorias: [[] as string[]],
      destacado: [false],
      es: this.fb.group({
        titulo: ['', Validators.required],
        descripcion: ['', Validators.required],
        artistas: this.fb.array([]),
        precios: this.fb.array([]),
      }),
      en: this.fb.group({
        titulo: ['', Validators.required],
        descripcion: ['', Validators.required],
        artistas: this.fb.array([]),
        precios: this.fb.array([]),
      }),
    });

    this.formEvento.get('fecha_inicio')?.valueChanges.subscribe((fecha: Date | null) => {
      this.fechaMinFin.set(fecha);
    });
  }

  private cargarEvento(evento: { es: Evento; en: Evento }): void {
    const es: Evento = evento.es;
    this.formEvento.patchValue({
      id: es.id,
      fecha_inicio: new Date(es.fecha_inicio),
      fecha_fin: new Date(es.fecha_fin),
      ubicacion: es.ubicacion,
      media_id: es.media_id,
      media_tipo: es.media_tipo,
      capacidad: es.capacidad,
      entradas_disponibles: es.entradas_disponibles,
      enlace_boletas: es.enlace_boletas || '',
      enlace_instagram: es.enlace_instagram || '',
      enlace_tiktok: es.enlace_tiktok || '',
      enlace_web: es.enlace_web || '',
      codigo_pulep: es.codigo_pulep || '',
      categorias: es.categorias,
      destacado: es.destacado,
      es: { titulo: es.titulo, descripcion: es.descripcion },
      en: { titulo: evento.en.titulo, descripcion: evento.en.descripcion },
    });

    if (es.forma_pago) {
      this.formaPagoArray.controls.forEach((ctrl: any) => {
        const match: FormaPagoItem | undefined = es.forma_pago.find(
          (fp: FormaPagoItem) => fp.tipo === ctrl.get('tipo')?.value
        );
        if (match) {
          ctrl.patchValue({ activo: true, telefono: match.telefono || '' });
        }
      });
    }

    this.cargarFormArray('es', 'artistas', es.artistas);
    this.cargarFormArray('en', 'artistas', evento.en.artistas);
    this.cargarFormArray('es', 'precios', es.precios);
    this.cargarFormArray('en', 'precios', evento.en.precios);
  }

  private cargarFormArray(idioma: 'es' | 'en', campo: 'artistas' | 'precios', items: EventoArtista[] | EventoPrecio[]): void {
    const arr: FormArray = this.getFormArray(idioma, campo);
    arr.clear();
    if (campo === 'artistas') {
      (items as EventoArtista[]).forEach((item: EventoArtista) => {
        arr.push(this.crearArtistaGroup(item.nombre, item.bio));
      });
    } else {
      (items as EventoPrecio[]).forEach((item: EventoPrecio) => {
        arr.push(this.crearPrecioGroup(item.categoria, item.valor, item.moneda, item.tipo_venta));
      });
    }
  }

  crearArtistaGroup(nombre: string = '', bio: string = ''): FormGroup {
    return this.fb.group({
      nombre: [nombre, Validators.required],
      bio: [bio],
    });
  }

  crearPrecioGroup(categoria: string = '', valor: number = 0, moneda: string = 'COP', tipo_venta: 'preventa' | 'dia_evento' = 'preventa'): FormGroup {
    return this.fb.group({
      categoria: [categoria, Validators.required],
      valor: [valor, [Validators.required, Validators.min(0)]],
      moneda: [moneda, Validators.required],
      tipo_venta: [tipo_venta, Validators.required],
    });
  }

  getIdiomaGroup(idioma: 'es' | 'en'): FormGroup {
    return this.formEvento.get(idioma) as FormGroup;
  }

  getFormArray(idioma: 'es' | 'en', campo: 'artistas' | 'precios'): FormArray {
    return this.getIdiomaGroup(idioma).get(campo) as FormArray;
  }

  get formaPagoArray(): FormArray {
    return this.formEvento.get('forma_pago') as FormArray;
  }

  agregarArtista(idioma: 'es' | 'en'): void {
    this.getFormArray(idioma, 'artistas').push(this.crearArtistaGroup());
  }

  eliminarArtista(idioma: 'es' | 'en', indice: number): void {
    this.getFormArray(idioma, 'artistas').removeAt(indice);
  }

  agregarPrecio(idioma: 'es' | 'en'): void {
    this.getFormArray(idioma, 'precios').push(this.crearPrecioGroup());
  }

  eliminarPrecio(idioma: 'es' | 'en', indice: number): void {
    this.getFormArray(idioma, 'precios').removeAt(indice);
  }

  filtrarCategorias(evento: { query: string }): void {
    const consulta: string = (evento.query || '').toLowerCase();
    this.categoriasFiltradas = this.sugerenciasCategorias.filter(
      (cat: string) => cat.toLowerCase().includes(consulta)
    );
  }

  onSubmit(): void {
    if (this.formEvento.invalid) {
      this.formEvento.markAllAsTouched();
      return;
    }

    const valores = this.formEvento.getRawValue();
    const formasPago: FormaPagoItem[] = this.formaPagoArray.controls
      .filter((ctrl: any) => ctrl.get('activo')?.value)
      .map((ctrl: any) => {
        const item: FormaPagoItem = { tipo: ctrl.get('tipo')?.value };
        if (ctrl.get('telefono')?.value) {
          item.telefono = ctrl.get('telefono')?.value;
        }
        return item;
      });

    const compartido = {
      id: valores.id,
      fecha_inicio: (valores.fecha_inicio as Date).toISOString(),
      fecha_fin: (valores.fecha_fin as Date).toISOString(),
      ubicacion: valores.ubicacion,
      media_id: valores.media_id,
      media_tipo: valores.media_tipo as 'image' | 'video',
      forma_pago: formasPago,
      capacidad: valores.capacidad as number,
      entradas_disponibles: valores.entradas_disponibles as number,
      enlace_boletas: valores.enlace_boletas || undefined,
      enlace_instagram: valores.enlace_instagram || undefined,
      enlace_tiktok: valores.enlace_tiktok || undefined,
      enlace_web: valores.enlace_web || undefined,
      codigo_pulep: valores.codigo_pulep || undefined,
      categorias: valores.categorias as string[],
      destacado: valores.destacado as boolean,
    };

    const eventoEs: Evento = {
      ...compartido,
      titulo: valores.es.titulo,
      descripcion: valores.es.descripcion,
      artistas: valores.es.artistas as EventoArtista[],
      precios: valores.es.precios as EventoPrecio[],
    };

    const eventoEn: Evento = {
      ...compartido,
      titulo: valores.en.titulo,
      descripcion: valores.en.descripcion,
      artistas: valores.en.artistas as EventoArtista[],
      precios: valores.en.precios as EventoPrecio[],
    };

    this.guardar.emit({ es: eventoEs, en: eventoEn });
  }

  onCancelar(): void {
    this.cancelar.emit();
  }

  private generarId(): string {
    const ahora: Date = new Date();
    const sufijo: string = Math.random().toString(36).substring(2, 6);
    return `evento-${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}${String(ahora.getDate()).padStart(2, '0')}-${sufijo}`;
  }
}
