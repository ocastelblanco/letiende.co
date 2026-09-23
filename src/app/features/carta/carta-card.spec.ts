import { TestBed } from '@angular/core/testing';
import { CardCarta } from './armar-carta';
import { CartaCard } from './carta-card';

const base: CardCarta = {
  categoria: 'bebidas',
  subcategoria: 'de_cafe',
  etiqueta: 'Bebidas de café',
  descripcion: 'Café arábigo',
  icono: 'coffee',
  destacada: false,
  productos: [
    {
      nombre: 'Espresso',
      descripcion: null,
      precio: 6600,
      precioFormateado: '$6.600',
      marcas: [],
      variantes: [],
    },
    {
      nombre: 'Latte',
      descripcion: 'Con leche',
      precio: 8400,
      precioFormateado: '$8.400',
      marcas: ['*', '†'],
      variantes: ['Grande', 'Pequeño'],
    },
  ],
  notasAlPie: [
    { marca: '*', texto: 'Pídelo en leche vegetal por $3.500' },
    { marca: '†', texto: 'Añade licor por $8.700' },
  ],
};

function pintar(card: CardCarta): HTMLElement {
  const fixture = TestBed.createComponent(CartaCard);
  fixture.componentRef.setInput('card', card);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('CartaCard', () => {
  it('usa el id de sección, h2, ul/li y precios con tabular-nums', () => {
    const html = pintar(base);
    const seccion = html.querySelector('section')!;
    expect(seccion.id).toBe('seccion-bebidas-de_cafe');
    expect(seccion.classList).toContain('scroll-mt-20');
    expect(seccion.getAttribute('aria-labelledby')).toBe(html.querySelector('h2')!.id);
    expect(html.querySelectorAll('ul > li').length).toBe(2);
    const precio = html.querySelector('li span.tabular-nums')!;
    expect(precio.textContent).toContain('$6.600');
    expect(precio.classList).toContain('text-primary');
    expect(precio.classList).toContain('font-semibold');
    expect(html.querySelector('[aria-hidden="true"]')!.textContent).toBe('coffee');
  });

  it('enlaza cada marca (sup) con su nota mediante aria-describedby', () => {
    const html = pintar(base);
    const sups = [...html.querySelectorAll('sup')];
    expect(sups.map((s) => s.textContent)).toEqual(['*', '†']);
    sups.forEach((sup, i) => {
      const nota = html.querySelector(`#${sup.getAttribute('aria-describedby')}`)!;
      expect(nota.textContent).toContain(base.notasAlPie[i].texto);
      expect(sup.classList).toContain('text-secondary');
    });
    expect(html.querySelector('.border-t')).not.toBeNull();
  });

  it('muestra descripción y variantes separadas por " · "', () => {
    const html = pintar(base);
    expect(html.textContent).toContain('Con leche');
    expect(html.textContent).toContain('Grande · Pequeño');
  });

  it('el ícono inválido cae a restaurant_menu', () => {
    const html = pintar({ ...base, icono: 'Mal Icono!' });
    expect(html.querySelector('[aria-hidden="true"]')!.textContent).toBe('restaurant_menu');
  });

  it('la card normal no tiene etiqueta Promoción ni borde destacado', () => {
    const html = pintar(base);
    expect(html.textContent).not.toContain('Promoción');
    expect(html.querySelector('section')!.classList).toContain('bg-white');
    expect(html.querySelector('section')!.classList).not.toContain('border-secondary');
  });

  it('la card destacada usa bg-primary, borde secondary y etiqueta Promoción', () => {
    const html = pintar({ ...base, destacada: true });
    const seccion = html.querySelector('section')!;
    expect(seccion.classList).toContain('bg-primary');
    expect(seccion.classList).toContain('border-2');
    expect(seccion.classList).toContain('border-secondary');
    expect(seccion.classList).not.toContain('bg-white');
    expect(html.textContent).toContain('Promoción');
    expect(html.querySelector('li span.tabular-nums')!.classList).toContain('text-neutral');
  });
});
