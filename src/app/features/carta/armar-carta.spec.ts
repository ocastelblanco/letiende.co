import {
  ContenidoCarta,
  MenuComandante,
  armarCarta,
  formatoPrecio,
  generarMarca,
  humanizarClave,
} from './armar-carta';

function contenido(parcial: Partial<ContenidoCarta> = {}): ContenidoCarta {
  return {
    publicadoEn: '2026-09-22T21:00:00.000Z',
    secciones: [],
    diccionario: { adiciones: {}, variantes: {} },
    ...parcial,
  };
}

describe('formatoPrecio()', () => {
  it('formatea en pesos colombianos, sin decimales, con punto de miles', () => {
    expect(formatoPrecio(6600)).toBe('$6.600');
    expect(formatoPrecio(8800)).toBe('$8.800');
    expect(formatoPrecio(100)).toBe('$100');
    expect(formatoPrecio(1000000)).toBe('$1.000.000');
  });

  it('redondea decimales', () => {
    expect(formatoPrecio(6600.4)).toBe('$6.600');
    expect(formatoPrecio(6600.6)).toBe('$6.601');
  });
});

describe('generarMarca()', () => {
  it('los primeros cinco índices usan los símbolos base', () => {
    expect([0, 1, 2, 3, 4].map(generarMarca)).toEqual(['*', '†', '‡', '§', '¶']);
  });

  it('más allá de 5, la secuencia dobla los símbolos en vez de cortarse', () => {
    expect([5, 6, 7, 8, 9].map(generarMarca)).toEqual(['**', '††', '‡‡', '§§', '¶¶']);
    expect(generarMarca(10)).toBe('***');
  });
});

describe('humanizarClave()', () => {
  it('reemplaza guiones bajos por espacios y capitaliza la primera letra', () => {
    expect(humanizarClave('de_cafe')).toBe('De cafe');
    expect(humanizarClave('indian_pale_ale')).toBe('Indian pale ale');
  });
});

describe('armarCarta()', () => {
  it('la misma adición con dos precios distintos en una card recibe dos marcas distintas', () => {
    // Caso real verificado en vivo el 22/09/2026: leche_vegetal cuesta 3.500
    // en la Bomba de chocolate y 5.300 en el Chocolate — mismo par
    // (adición, precio) tiene que repetirse la marca, no el par distinto.
    const menu: MenuComandante = {
      updatedAt: '2026-09-22T00:00:00.000Z',
      items: [
        {
          name: 'Bomba de chocolate',
          description: null,
          additions: [{ addition: 'leche_vegetal', additionPrice: 3500 }],
          variants: [],
          category: 'bebidas',
          subcategory: 'calientes',
          basePrice: 12500,
        },
        {
          name: 'Chocolate',
          description: null,
          additions: [{ addition: 'leche_vegetal', additionPrice: 5300 }],
          variants: [],
          category: 'bebidas',
          subcategory: 'calientes',
          basePrice: 8400,
        },
      ],
    };
    const dic = contenido({
      diccionario: { adiciones: { leche_vegetal: 'Pídelo en leche vegetal' }, variantes: {} },
    });

    const carta = armarCarta(menu, dic);

    expect(carta.cards).toHaveLength(1);
    const card = carta.cards[0];
    // Chocolate va primero por precio (8.400 < 12.500), así que su par
    // (leche_vegetal, 5300) es el que aparece primero — se lleva la marca
    // `*`; Bomba de chocolate y su par (leche_vegetal, 3500) van segundo.
    expect(card.notasAlPie).toEqual([
      { marca: '*', texto: 'Pídelo en leche vegetal por $5.300' },
      { marca: '†', texto: 'Pídelo en leche vegetal por $3.500' },
    ]);
    expect(card.productos[0].nombre).toBe('Chocolate');
    expect(card.productos[0].marcas).toEqual(['*']);
    expect(card.productos[1].nombre).toBe('Bomba de chocolate');
    expect(card.productos[1].marcas).toEqual(['†']);
  });

  it('una sección con visible: false no aparece, aunque tenga productos', () => {
    const menu: MenuComandante = {
      updatedAt: '2026-09-22T00:00:00.000Z',
      items: [
        {
          name: 'Espresso',
          description: null,
          additions: [],
          variants: [],
          category: 'bebidas',
          subcategory: 'de_cafe',
          basePrice: 6600,
        },
      ],
    };
    const dic = contenido({
      secciones: [
        {
          categoria: 'bebidas',
          subcategoria: 'de_cafe',
          etiqueta: 'Bebidas de café',
          descripcion: null,
          icono: 'coffee',
          orden: 1,
          visible: false,
          destacada: false,
        },
      ],
    });

    expect(armarCarta(menu, dic).cards).toHaveLength(0);
  });

  it('una categoría ausente de la hoja usa respaldo humanizado, sin perder productos', () => {
    const menu: MenuComandante = {
      updatedAt: '2026-09-22T00:00:00.000Z',
      items: [
        {
          name: 'Empanada',
          description: null,
          additions: [],
          variants: ['carne', 'queso'],
          category: 'comida',
          subcategory: null,
          basePrice: 2700,
        },
      ],
    };

    const carta = armarCarta(menu, contenido());

    expect(carta.cards).toHaveLength(1);
    const card = carta.cards[0];
    expect(card.etiqueta).toBe('Comida');
    expect(card.icono).toBe('restaurant_menu');
    expect(card.productos[0].nombre).toBe('Empanada');
    // Sin diccionario, las variantes también se humanizan.
    expect(card.productos[0].variantes).toEqual(['Carne', 'Queso']);
  });

  it('las cards sin subcategoría (comida, repostería) se arman igual que las que sí tienen', () => {
    const menu: MenuComandante = {
      updatedAt: '2026-09-22T00:00:00.000Z',
      items: [
        {
          name: 'Torta de zanahoria',
          description: null,
          additions: [],
          variants: [],
          category: 'reposteria',
          subcategory: null,
          basePrice: 9000,
        },
        {
          name: 'Pastel de espinaca',
          description: null,
          additions: [],
          variants: [],
          category: 'comida',
          subcategory: null,
          basePrice: 8700,
        },
      ],
    };
    const dic = contenido({
      secciones: [
        {
          categoria: 'comida',
          subcategoria: null,
          etiqueta: 'Comida',
          descripcion: null,
          icono: 'restaurant',
          orden: 1,
          visible: true,
          destacada: false,
        },
        {
          categoria: 'reposteria',
          subcategoria: null,
          etiqueta: 'Repostería',
          descripcion: null,
          icono: 'cake',
          orden: 2,
          visible: true,
          destacada: false,
        },
      ],
    });

    const carta = armarCarta(menu, dic);
    expect(carta.cards.map((c) => c.etiqueta)).toEqual(['Comida', 'Repostería']);
    expect(carta.cards[0].subcategoria).toBeNull();
  });

  it('ordena las cards por `orden`; las que faltan en la hoja van al final, alfabéticamente', () => {
    const menu: MenuComandante = {
      updatedAt: '2026-09-22T00:00:00.000Z',
      items: [
        {
          name: 'A',
          description: null,
          additions: [],
          variants: [],
          category: 'zzz',
          subcategory: null,
          basePrice: 1,
        },
        {
          name: 'B',
          description: null,
          additions: [],
          variants: [],
          category: 'bebidas',
          subcategory: 'de_cafe',
          basePrice: 1,
        },
        {
          name: 'C',
          description: null,
          additions: [],
          variants: [],
          category: 'aaa',
          subcategory: null,
          basePrice: 1,
        },
        {
          name: 'D',
          description: null,
          additions: [],
          variants: [],
          category: 'comida',
          subcategory: null,
          basePrice: 1,
        },
      ],
    };
    const dic = contenido({
      secciones: [
        {
          categoria: 'comida',
          subcategoria: null,
          etiqueta: 'Comida',
          descripcion: null,
          icono: null,
          orden: 2,
          visible: true,
          destacada: false,
        },
        {
          categoria: 'bebidas',
          subcategoria: 'de_cafe',
          etiqueta: 'Bebidas de café',
          descripcion: null,
          icono: null,
          orden: 1,
          visible: true,
          destacada: false,
        },
      ],
    });

    const carta = armarCarta(menu, dic);
    // Con orden real primero (1, 2), luego las de respaldo alfabéticamente
    // por su etiqueta humanizada: "Aaa " -> "Aaa", "Zzz " -> "Zzz".
    expect(carta.cards.map((c) => c.etiqueta)).toEqual(['Bebidas de café', 'Comida', 'Aaa', 'Zzz']);
  });

  it('ordena los productos de una card por precio ascendente y luego por nombre', () => {
    const menu: MenuComandante = {
      updatedAt: '2026-09-22T00:00:00.000Z',
      items: [
        {
          name: 'Zeta',
          description: null,
          additions: [],
          variants: [],
          category: 'comida',
          subcategory: null,
          basePrice: 5000,
        },
        {
          name: 'Alfa',
          description: null,
          additions: [],
          variants: [],
          category: 'comida',
          subcategory: null,
          basePrice: 5000,
        },
        {
          name: 'Beta',
          description: null,
          additions: [],
          variants: [],
          category: 'comida',
          subcategory: null,
          basePrice: 3000,
        },
      ],
    };

    const carta = armarCarta(menu, contenido());
    expect(carta.cards[0].productos.map((p) => p.nombre)).toEqual(['Beta', 'Alfa', 'Zeta']);
  });

  it('sin contenido editorial (null), arma la carta igual, con respaldos en todo', () => {
    const menu: MenuComandante = {
      updatedAt: '2026-09-22T00:00:00.000Z',
      items: [
        {
          name: 'Espresso',
          description: null,
          additions: [{ addition: 'licor', additionPrice: 8700 }],
          variants: [],
          category: 'bebidas',
          subcategory: 'de_cafe',
          basePrice: 6600,
        },
      ],
    };

    const carta = armarCarta(menu, null);
    expect(carta.cards).toHaveLength(1);
    expect(carta.cards[0].productos[0].precioFormateado).toBe('$6.600');
    expect(carta.cards[0].notasAlPie).toEqual([{ marca: '*', texto: 'Licor por $8.700' }]);
  });

  it('la descripción del producto viaja tal cual, cuando existe (cocteles)', () => {
    const menu: MenuComandante = {
      updatedAt: '2026-09-22T00:00:00.000Z',
      items: [
        {
          name: 'Negroni',
          description: 'Gin, Campari y vermú rojo en partes iguales',
          additions: [],
          variants: [],
          category: 'cocteles',
          subcategory: 'clasicos',
          basePrice: 24000,
        },
      ],
    };

    const carta = armarCarta(menu, contenido());
    expect(carta.cards[0].productos[0].descripcion).toBe(
      'Gin, Campari y vermú rojo en partes iguales',
    );
  });

  it('secciones destacadas conservan la marca en la card armada', () => {
    const menu: MenuComandante = {
      updatedAt: '2026-09-22T00:00:00.000Z',
      items: [
        {
          name: 'Combo 2x1',
          description: null,
          additions: [],
          variants: [],
          category: 'ofertas',
          subcategory: 'promociones',
          basePrice: 15000,
        },
      ],
    };
    const dic = contenido({
      secciones: [
        {
          categoria: 'ofertas',
          subcategoria: 'promociones',
          etiqueta: 'Promociones',
          descripcion: null,
          icono: 'sell',
          orden: 1,
          visible: true,
          destacada: true,
        },
      ],
    });

    expect(armarCarta(menu, dic).cards[0].destacada).toBe(true);
  });
});
