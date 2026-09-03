import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/core';
import { JsonLdService } from './json-ld.service';

describe('JsonLdService', () => {
  let servicio: JsonLdService;
  let documento: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(JsonLdService);
    documento = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    documento.getElementById('prueba')?.remove();
  });

  it('inserta un <script type="application/ld+json"> con el id dado', () => {
    servicio.establecer('prueba', { '@type': 'Organization', name: 'Le Tiende' });
    const script = documento.getElementById('prueba') as HTMLScriptElement;
    expect(script).toBeTruthy();
    expect(script.type).toBe('application/ld+json');
    expect(JSON.parse(script.textContent ?? '')).toEqual({
      '@type': 'Organization',
      name: 'Le Tiende',
    });
  });

  it('reemplaza el contenido en vez de acumular scripts al llamarse de nuevo con el mismo id', () => {
    servicio.establecer('prueba', { valor: 1 });
    servicio.establecer('prueba', { valor: 2 });
    expect(documento.querySelectorAll('#prueba').length).toBe(1);
    const script = documento.getElementById('prueba') as HTMLScriptElement;
    expect(JSON.parse(script.textContent ?? '')).toEqual({ valor: 2 });
  });

  it('escapa "<" para que un título con </script> no rompa el bloque (CLAUDE.md §5, A03)', () => {
    servicio.establecer('prueba', { name: '</script><script>alert(1)</script>' });
    const script = documento.getElementById('prueba') as HTMLScriptElement;
    expect(script.textContent).not.toContain('</script><script>');
    expect(JSON.parse(script.textContent ?? '').name).toBe('</script><script>alert(1)</script>');
  });
});
