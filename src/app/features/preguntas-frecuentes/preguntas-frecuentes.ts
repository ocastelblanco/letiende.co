import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MetaService } from '@core/seo/meta.service';
import { JsonLdService } from '@core/seo/json-ld.service';
import { esquemaFaqPage, esquemaMigasDePan } from '@core/seo/esquemas';
import { DATOS_NEGOCIO } from '@core/negocio/datos-negocio';

interface PreguntaFrecuente {
  readonly pregunta: string;
  readonly respuesta: string;
}

@Component({
  selector: 'app-preguntas-frecuentes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preguntas-frecuentes.html',
})
export class PreguntasFrecuentesComponent {
  private readonly meta = inject(MetaService);
  private readonly jsonLd = inject(JsonLdService);

  // Única fuente de las preguntas: alimenta tanto el template (@for) como
  // esquemaFaqPage() más abajo, para no declarar el contenido dos veces.
  protected readonly datosNegocio = DATOS_NEGOCIO;
  protected readonly preguntas: readonly PreguntaFrecuente[] = this.construirPreguntas();

  constructor() {
    this.meta.actualizar({
      titulo: 'Preguntas frecuentes - Le Tiende',
      descripcion:
        'Horarios, ubicación, parqueadero, accesibilidad y cómo programar un evento en Le Tiende.',
      ruta: '/preguntas-frecuentes',
    });

    this.jsonLd.establecer('ld-pagina', [
      esquemaFaqPage(this.preguntas),
      esquemaMigasDePan([
        { nombre: 'Inicio', ruta: '/' },
        { nombre: 'Preguntas frecuentes', ruta: '/preguntas-frecuentes' },
      ]),
    ]);
  }

  private construirPreguntas(): PreguntaFrecuente[] {
    const horarios = DATOS_NEGOCIO.horarios
      .map((bloque) => `${bloque.diasEs}: ${bloque.horarioEs}`)
      .join('. ');

    return [
      {
        pregunta: '¿Cuáles son los horarios de atención?',
        respuesta: `Puedes venir a darte gusto todos los días de la semana: ${horarios}.`,
      },
      {
        pregunta: '¿Dónde queda Le Tiende?',
        respuesta: `En el Parkway, el corazón hipster de Bogotá 🧔🏻 👓 ☕ 🧢. La dirección es ${DATOS_NEGOCIO.direccion}.`,
      },
      {
        pregunta: '¿Hay parqueadero?',
        respuesta:
          'Le Tiende no cuenta con parqueadero propio, pero puedes encontrar varios 🅿️ en la zona o puedes llegar fácilmente en transporte público 🚌 o bici 🚲.',
      },
      {
        pregunta: '¿El espacio es accesible para personas con movilidad reducida?',
        respuesta:
          'El acceso actual no está optimizado, pero estamos trabajando 👷🏽 para hacer nuestro espacio accesible para todos 🦽 🦯 🧏🏽‍♂️.',
      },
      {
        pregunta: '¿Son pet friendly?',
        respuesta: 'Sí, las mascotas 🐶 🐱 son bienvenidas… con algunas excepciones 🐍.',
      },
      {
        pregunta: '¿Cómo puedo programar un evento propio en el espacio?',
        respuesta:
          'Escríbenos por WhatsApp al +57 318 7056288 y reservamos el espacio para tu evento o espectáculo.',
      },
    ];
  }
}
