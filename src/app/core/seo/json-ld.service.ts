import { DOCUMENT, Injectable, inject } from '@angular/core';

/**
 * Inserta datos estructurados JSON-LD en `<head>`, uno por `id` (así una
 * página puede tener varios bloques — p.ej. Organization+WebSite a nivel de
 * App, LocalBusiness+ItemList en Inicio — sin que uno pise al otro, y
 * navegar entre rutas actualiza el bloque en vez de acumularlo).
 *
 * El escape de `<` es obligatorio — CLAUDE.md §5, A03: sin él, un título de
 * evento que contenga `</script>` rompe el bloque y ejecuta lo que siga.
 */
@Injectable({ providedIn: 'root' })
export class JsonLdService {
  private readonly documento = inject(DOCUMENT);

  establecer(id: string, datos: unknown): void {
    const contenido = JSON.stringify(datos).replace(/</g, '\\u003c');
    let script = this.documento.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = this.documento.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      this.documento.head.appendChild(script);
    }
    script.textContent = contenido;
  }

  quitar(id: string): void {
    this.documento.getElementById(id)?.remove();
  }
}
