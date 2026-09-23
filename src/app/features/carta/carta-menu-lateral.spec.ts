import { TestBed } from '@angular/core/testing';
import { CartaMenuLateral, EntradaMenuCarta } from './carta-menu-lateral';
import { FABRICA_OBSERVADOR } from './carta-observador';

const entradas: EntradaMenuCarta[] = [
  { id: 'seccion-a', etiqueta: 'Sección A', icono: 'coffee', destacada: false },
  { id: 'seccion-b', etiqueta: 'Sección B', icono: 'wine_bar', destacada: true },
];

describe('CartaMenuLateral', () => {
  let cambiar: (id: string, visible: boolean) => void;
  let observados: string[];
  let desconectado: boolean;

  function montar() {
    observados = [];
    desconectado = false;
    // Elementos reales en el documento, como los que pinta la página.
    for (const e of entradas) {
      const el = document.createElement('section');
      el.id = e.id;
      el.scrollIntoView = vi.fn();
      document.body.appendChild(el);
    }
    TestBed.configureTestingModule({
      providers: [
        {
          provide: FABRICA_OBSERVADOR,
          useValue: (alCambiar: (id: string, visible: boolean) => void) => {
            cambiar = alCambiar;
            return {
              observar: (el: Element) => observados.push(el.id),
              desconectar: () => (desconectado = true),
            };
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(CartaMenuLateral);
    fixture.componentRef.setInput('entradas', entradas);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    for (const e of entradas) document.getElementById(e.id)?.remove();
  });

  it('colapsado por defecto: solo íconos, con aria-label y aria-expanded=false', () => {
    const html = montar().nativeElement as HTMLElement;
    const enlaces = [...html.querySelectorAll('a')];
    expect(enlaces.map((a) => a.getAttribute('aria-label'))).toEqual(['Sección A', 'Sección B']);
    expect(enlaces.map((a) => a.getAttribute('href'))).toEqual([
      '/carta#seccion-a',
      '/carta#seccion-b',
    ]);
    expect(html.textContent).not.toContain('Sección A');
    const boton = html.querySelector('button')!;
    expect(boton.getAttribute('aria-expanded')).toBe('false');
    expect(boton.getAttribute('aria-controls')).toBe(html.querySelector('ul')!.id);
    expect(boton.textContent).toContain('chevron_right');
    expect(html.querySelector('nav')!.getAttribute('aria-label')).toBeTruthy();
    expect(html.querySelectorAll('.bg-secondary.ring-1').length).toBe(1); // punto de la destacada
  });

  it('expande y contrae con el botón (chevron y etiquetas cambian)', () => {
    const fixture = montar();
    const html = fixture.nativeElement as HTMLElement;
    html.querySelector('button')!.click();
    fixture.detectChanges();
    expect(html.querySelector('button')!.getAttribute('aria-expanded')).toBe('true');
    expect(html.querySelector('button')!.textContent).toContain('chevron_left');
    expect(html.textContent).toContain('Sección A');
    html.querySelector('button')!.click();
    fixture.detectChanges();
    expect(html.querySelector('button')!.getAttribute('aria-expanded')).toBe('false');
  });

  it('la sección activa (observador simulado) recibe aria-current y bg-secondary', () => {
    const fixture = montar();
    const html = fixture.nativeElement as HTMLElement;
    expect(observados).toEqual(['seccion-a', 'seccion-b']);
    expect(html.querySelector('[aria-current]')).toBeNull();

    cambiar('seccion-b', true);
    fixture.detectChanges();
    const activa = html.querySelector('[aria-current="true"]')!;
    expect(activa.getAttribute('aria-label')).toBe('Sección B');
    expect(activa.classList).toContain('bg-secondary');

    // Si A y B están visibles, gana la primera en el orden de la página.
    cambiar('seccion-a', true);
    fixture.detectChanges();
    expect(html.querySelector('[aria-current="true"]')!.getAttribute('aria-label')).toBe(
      'Sección A',
    );
    expect(html.querySelectorAll('[aria-current]').length).toBe(1);

    // Sin ninguna visible se conserva la última activa.
    cambiar('seccion-a', false);
    cambiar('seccion-b', false);
    fixture.detectChanges();
    expect(html.querySelector('[aria-current="true"]')).not.toBeNull();
  });

  it('elegir una sección desplaza a la card, la marca activa y colapsa el menú', () => {
    const fixture = montar();
    const html = fixture.nativeElement as HTMLElement;
    html.querySelector('button')!.click();
    fixture.detectChanges();

    const clic = new MouseEvent('click', { bubbles: true, cancelable: true });
    html.querySelectorAll('a')[1].dispatchEvent(clic);
    fixture.detectChanges();

    expect(clic.defaultPrevented).toBe(true);
    expect(document.getElementById('seccion-b')!.scrollIntoView).toHaveBeenCalled();
    expect(html.querySelector('[aria-current="true"]')!.getAttribute('aria-label')).toBe(
      'Sección B',
    );
    expect(html.querySelector('button')!.getAttribute('aria-expanded')).toBe('false');
  });

  it('Escape colapsa el menú y al destruir se desconecta el observador', () => {
    const fixture = montar();
    const html = fixture.nativeElement as HTMLElement;
    html.querySelector('button')!.click();
    fixture.detectChanges();
    html
      .querySelector('button')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(html.querySelector('button')!.getAttribute('aria-expanded')).toBe('false');
    fixture.destroy();
    expect(desconectado).toBe(true);
  });
});
