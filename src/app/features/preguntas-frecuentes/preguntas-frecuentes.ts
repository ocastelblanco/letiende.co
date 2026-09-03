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
        respuesta: `Nuestros horarios de atención son: ${horarios}.`,
      },
      {
        pregunta: '¿Dónde queda Le Tiende?',
        respuesta: `Le Tiende queda en ${DATOS_NEGOCIO.direccion}.`,
      },
      {
        pregunta: '¿Hay parqueadero?',
        respuesta: 'No, Le Tiende no cuenta con parqueadero propio.',
      },
      {
        pregunta: '¿El espacio es accesible para personas con movilidad reducida?',
        respuesta:
          'El acceso actual es limitado: el espacio tiene escaleras y otras barreras físicas que todavía no se han resuelto.',
      },
      {
        pregunta: '¿Cómo puedo programar un evento propio en el espacio?',
        respuesta: 'Escríbenos por WhatsApp al +57 318 7056288 para conversar sobre tu propuesta.',
      },
    ];
  }
}
