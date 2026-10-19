import { idSeccion } from './carta-ids';

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
});
