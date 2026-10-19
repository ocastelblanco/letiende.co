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
      adiciones: [],
    },
    {
      nombre: 'Latte',
      descripcion: 'Con leche',
      precio: 8400,
      precioFormateado: '$8.400',
      adiciones: ['Pídelo en leche vegetal por $3.500', 'Añade licor por $8.700'],
    },
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
    expect(html.querySelectorAll('section > ul > li').length).toBe(2);
    const precio = html.querySelector('li span.tabular-nums')!;
    expect(precio.textContent).toContain('$6.600');
    expect(precio.classList).toContain('text-primary');
    expect(precio.classList).toContain('font-semibold');
    expect(html.querySelector('[aria-hidden="true"]')!.textContent).toBe('coffee');
  });

  it('muestra las adiciones bajo el producto, en una lista, y no hay sup ni notas al pie', () => {
    const html = pintar(base);
    const productos = html.querySelectorAll('section > ul > li');
    expect(productos[0].querySelector('ul')).toBeNull();
    const adiciones = [...productos[1].querySelectorAll('ul > li')];
    expect(adiciones.map((a) => a.textContent?.trim())).toEqual(base.productos[1].adiciones);
    expect(productos[1].querySelector('ul')!.classList).toContain('text-xs');
    expect(productos[1].querySelector('ul')!.classList).toContain('text-primary/70');
    expect(html.querySelector('sup')).toBeNull();
    expect(html.querySelector('.border-t')).toBeNull();
  });

  it('las adiciones de una card destacada usan los colores de texto invertidos', () => {
    const html = pintar({ ...base, destacada: true });
    const lista = html.querySelectorAll('section > ul > li')[1].querySelector('ul')!;
    expect(lista.classList).toContain('text-neutral/80');
    expect(lista.classList).not.toContain('text-primary/70');
  });

  it('muestra la descripción y ya no renderiza línea de variantes', () => {
    const html = pintar(base);
    expect(html.textContent).toContain('Con leche');
    expect(html.textContent).not.toContain('·');
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
