import { idNota, idSeccion } from './carta-ids';

describe('ids de la carta', () => {
  it('idSeccion con y sin subcategoría', () => {
    expect(idSeccion({ categoria: 'bebidas', subcategoria: 'de_cafe' })).toBe(
      'seccion-bebidas-de_cafe',
    );
    expect(idSeccion({ categoria: 'comida', subcategoria: null })).toBe('seccion-comida');
  });

  it('idSeccion neutraliza caracteres no seguros para un id/ancla', () => {
    expect(idSeccion({ categoria: 'Bebidas Frías!', subcategoria: null })).toBe(
      'seccion-bebidas-fr-as-',
    );
  });

  it('idNota es único por card y por nota', () => {
    expect(idNota('seccion-comida', 0)).toBe('seccion-comida-nota-0');
    expect(idNota('seccion-comida', 1)).not.toBe(idNota('seccion-bebidas', 1));
  });
});
