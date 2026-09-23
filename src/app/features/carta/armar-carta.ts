/**
 * Armado puro de la carta del café bar a partir de las dos fuentes de datos
 * (tech-specs.md §4.6): el `menu.json` de Comandante (precios, productos) y
 * el contenido editorial publicado desde la hoja maestra (secciones,
 * diccionario). Sin efectos secundarios, sin peticiones — es donde un error
 * muestra un precio equivocado al público, por eso lleva pruebas exhaustivas
 * (`armar-carta.spec.ts`).
 */

// ---------------------------------------------------------------------------
// Entrada: `menu.json` de Comandante (§4.6, contrato verificado en vivo el
// 22/09/2026 contra `https://comandante.letiende.co/menu.json`).
// ---------------------------------------------------------------------------

export interface AdicionMenu {
  readonly addition: string;
  readonly additionPrice: number;
}

export interface ProductoMenu {
  readonly name: string;
  readonly description: string | null;
  readonly additions: readonly AdicionMenu[];
  readonly variants: readonly string[];
  readonly category: string;
  readonly subcategory: string | null;
  readonly basePrice: number;
}

export interface MenuComandante {
  readonly updatedAt: string;
  readonly items: readonly ProductoMenu[];
}

// ---------------------------------------------------------------------------
// Entrada: contenido editorial publicado por la Web App de Apps Script
// (§4.6, ADR-023). Puede ser `null` — sin publicación previa, o si la
// lectura falló y no hay copia buena en caché (`CartaService`, T-0037).
// ---------------------------------------------------------------------------

export interface SeccionContenido {
  readonly categoria: string;
  readonly subcategoria: string | null;
  readonly etiqueta: string;
  readonly descripcion: string | null;
  readonly icono: string | null;
  readonly orden: number;
  readonly visible: boolean;
  readonly destacada: boolean;
}

export interface ContenidoCarta {
  readonly publicadoEn: string | null;
  readonly secciones: readonly SeccionContenido[];
  readonly diccionario: {
    readonly adiciones: Readonly<Record<string, string>>;
    readonly variantes: Readonly<Record<string, string>>;
  };
}

// ---------------------------------------------------------------------------
// Salida: la carta ya armada, lista para la plantilla (`DESIGN.md` §11).
// ---------------------------------------------------------------------------

/** Una nota al pie de la card: `* Pídelo en leche vegetal por $3.500`. */
export interface NotaAlPieCarta {
  readonly marca: string;
  readonly texto: string;
}

export interface ProductoCartaArmado {
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly precio: number;
  readonly precioFormateado: string;
  /** Marcas junto al nombre (`*`, `†`…), en el orden en que deben mostrarse. */
  readonly marcas: readonly string[];
  /** Etiquetas de variantes ya resueltas contra el diccionario, en el orden del producto. */
  readonly variantes: readonly string[];
}

export interface CardCarta {
  readonly categoria: string;
  readonly subcategoria: string | null;
  readonly etiqueta: string;
  readonly descripcion: string | null;
  /** Nombre de ícono de Material Symbols. Nunca vacío: respaldo `restaurant_menu`. */
  readonly icono: string;
  readonly destacada: boolean;
  readonly productos: readonly ProductoCartaArmado[];
  readonly notasAlPie: readonly NotaAlPieCarta[];
}

export interface CartaArmada {
  readonly cards: readonly CardCarta[];
}

// ---------------------------------------------------------------------------
// Helpers puros
// ---------------------------------------------------------------------------

/** Ícono de respaldo cuando la sección no está en la hoja o no trae ícono. */
const ICONO_RESPALDO = 'restaurant_menu';

/**
 * Secuencia de marcas de nota al pie: `*, †, ‡, §, ¶, **, ††, ‡‡, §§, ¶¶, ***…`
 * (tech-specs.md §4.6, paso 5). Los 5 símbolos base se repiten duplicándose,
 * triplicándose, etc., una vez agotada la primera vuelta — no hay techo
 * realista de pares distintos por card, pero la secuencia no se corta nunca.
 */
const SIMBOLOS_BASE = ['*', '†', '‡', '§', '¶'] as const;

export function generarMarca(indice: number): string {
  const nivel = Math.floor(indice / SIMBOLOS_BASE.length) + 1;
  const simbolo = SIMBOLOS_BASE[indice % SIMBOLOS_BASE.length];
  return simbolo.repeat(nivel);
}

/** `de_cafe` → `De cafe`. Respaldo cuando falta la traducción real (degradación, §4.6). */
export function humanizarClave(clave: string): string {
  const conEspacios = clave.replace(/_/g, ' ').trim();
  if (!conEspacios) return conEspacios;
  return conEspacios.charAt(0).toUpperCase() + conEspacios.slice(1);
}

/** `6600` → `$6.600`. Pesos colombianos sin decimales, punto de miles (§4.6, paso 8). */
export function formatoPrecio(valor: number): string {
  const entero = Math.round(valor);
  const conMiles = Math.abs(entero)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (entero < 0 ? '-$' : '$') + conMiles;
}

function claveSeccion(categoria: string, subcategoria: string | null | undefined): string {
  return `${categoria}/${subcategoria ?? ''}`;
}

/** `leche_vegetal|3500` — identifica un par (adición, precio) dentro de una card. */
function clavePar(adicion: string, precio: number): string {
  return `${adicion}|${precio}`;
}

// ---------------------------------------------------------------------------
// armarCarta()
// ---------------------------------------------------------------------------

/**
 * Agrupa, ordena, resuelve etiquetas y asigna las notas al pie. Nunca lanza:
 * ante datos incompletos, degrada con respaldos (§4.6) en vez de omitir un
 * producto con precio real.
 */
export function armarCarta(menu: MenuComandante, contenido: ContenidoCarta | null): CartaArmada {
  const secciones = contenido?.secciones ?? [];
  const diccionario = contenido?.diccionario ?? { adiciones: {}, variantes: {} };

  const seccionPorClave = new Map<string, SeccionContenido>();
  for (const seccion of secciones) {
    seccionPorClave.set(claveSeccion(seccion.categoria, seccion.subcategoria), seccion);
  }

  // 1. Agrupa los productos por (category, subcategory). Un grupo vacío es
  // imposible por construcción: solo existen los grupos que algún producto
  // real generó.
  const productosPorClave = new Map<string, ProductoMenu[]>();
  for (const item of menu.items) {
    const clave = claveSeccion(item.category, item.subcategory);
    const lista = productosPorClave.get(clave);
    if (lista) {
      lista.push(item);
    } else {
      productosPorClave.set(clave, [item]);
    }
  }

  const cards: CardCarta[] = [];

  for (const [clave, productos] of productosPorClave) {
    const seccion = seccionPorClave.get(clave);

    // 2. Descarta los grupos cuya sección tenga visible: false.
    if (seccion?.visible === false) continue;

    const primerProducto = productos[0];
    const etiqueta = seccion?.etiqueta ?? humanizarClave(clave.replace('/', ' ').trim());

    // 4. Dentro de cada card, ordena los productos por basePrice ascendente
    // y luego por name.
    const productosOrdenados = [...productos].sort(
      (a, b) => a.basePrice - b.basePrice || a.name.localeCompare(b.name, 'es'),
    );

    // 5. Notas al pie por par (adición, precio), en orden de primera
    // aparición dentro de la card.
    const marcaPorPar = new Map<string, string>();
    const notasAlPie: NotaAlPieCarta[] = [];
    for (const producto of productosOrdenados) {
      for (const adicion of producto.additions) {
        const par = clavePar(adicion.addition, adicion.additionPrice);
        if (marcaPorPar.has(par)) continue;
        const marca = generarMarca(marcaPorPar.size);
        marcaPorPar.set(par, marca);
        const textoBase =
          diccionario.adiciones[adicion.addition] ?? humanizarClave(adicion.addition);
        notasAlPie.push({
          marca,
          texto: `${textoBase} por ${formatoPrecio(adicion.additionPrice)}`,
        });
      }
    }

    const productosArmados: ProductoCartaArmado[] = productosOrdenados.map((producto) => ({
      nombre: producto.name,
      descripcion: producto.description,
      precio: producto.basePrice,
      precioFormateado: formatoPrecio(producto.basePrice),
      marcas: producto.additions.map(
        (a) => marcaPorPar.get(clavePar(a.addition, a.additionPrice)) as string,
      ),
      // 6. Las variantes no alteran el precio; solo se muestran resueltas.
      variantes: producto.variants.map((v) => diccionario.variantes[v] ?? humanizarClave(v)),
    }));

    cards.push({
      categoria: primerProducto.category,
      subcategoria: primerProducto.subcategory,
      etiqueta,
      descripcion: seccion?.descripcion ?? null,
      icono: seccion?.icono || ICONO_RESPALDO,
      destacada: seccion?.destacada ?? false,
      productos: productosArmados,
      notasAlPie,
      // `orden` no viaja en `CardCarta` — se resuelve en el paso de ordenar
      // de abajo y no hace falta que la plantilla lo conozca.
    });
  }

  // 3. Ordena las cards por orden; las que no estén en la hoja van al final,
  // en orden alfabético de su etiqueta (de respaldo o real, si la hoja no
  // trae `orden` para ella).
  const ordenPorClave = new Map<string, number>();
  for (const seccion of secciones) {
    ordenPorClave.set(claveSeccion(seccion.categoria, seccion.subcategoria), seccion.orden);
  }

  const cardsOrdenadas = [...cards].sort((a, b) => {
    const ordenA = ordenPorClave.get(claveSeccion(a.categoria, a.subcategoria));
    const ordenB = ordenPorClave.get(claveSeccion(b.categoria, b.subcategoria));
    if (ordenA !== undefined && ordenB !== undefined) return ordenA - ordenB;
    if (ordenA !== undefined) return -1; // A tiene orden real, va antes que B (sin orden)
    if (ordenB !== undefined) return 1;
    return a.etiqueta.localeCompare(b.etiqueta, 'es');
  });

  return { cards: cardsOrdenadas };
}
