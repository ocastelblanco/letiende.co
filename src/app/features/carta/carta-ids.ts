import { CardCarta } from './armar-carta';

const NO_PERMITIDO = /[^a-z0-9_-]+/g;

/** `id` de la card y ancla del menú: `seccion-<categoria>[-<subcategoria>]`. */
export function idSeccion(card: Pick<CardCarta, 'categoria' | 'subcategoria'>): string {
  const partes = [card.categoria, card.subcategoria].filter((p): p is string => !!p);
  return `seccion-${partes.join('-').toLowerCase().replace(NO_PERMITIDO, '-')}`;
}

/** `id` único por card de cada nota al pie, al que apunta `aria-describedby`. */
export function idNota(idDeSeccion: string, indice: number): string {
  return `${idDeSeccion}-nota-${indice}`;
}
