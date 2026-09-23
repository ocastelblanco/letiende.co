import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/core';
import {
  MaterialSymbolsService,
  ICONO_RESPALDO,
  normalizarIcono,
  urlMaterialSymbols,
} from './material-symbols';

const BASE = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&icon_names=';

describe('urlMaterialSymbols', () => {
  it('ordena alfabéticamente, sin repetidos, e incluye los fijos', () => {
    expect(urlMaterialSymbols(['wine_bar', 'coffee', 'coffee', 'bakery_dining'])).toBe(
      `${BASE}bakery_dining,chevron_left,chevron_right,coffee,restaurant_menu,wine_bar&display=block`,
    );
  });

  it('sin íconos devuelve solo los fijos', () => {
    expect(urlMaterialSymbols([])).toBe(
      `${BASE}chevron_left,chevron_right,restaurant_menu&display=block`,
    );
  });

  it.each(['Coffee', 'cof fee', 'a&b', 'x<script>', '../x', 'café', '', null, undefined])(
    'un ícono inválido (%s) pasa a restaurant_menu y no se cuela en la URL',
    (malo) => {
      const url = urlMaterialSymbols([malo, 'coffee']);
      expect(url).toBe(`${BASE}chevron_left,chevron_right,coffee,restaurant_menu&display=block`);
      expect(normalizarIcono(malo)).toBe(ICONO_RESPALDO);
    },
  );
});

describe('MaterialSymbolsService', () => {
  it('agrega un único <link> (reutilizándolo) y lo quita', () => {
    const servicio = TestBed.inject(MaterialSymbolsService);
    const doc = TestBed.inject(DOCUMENT);

    servicio.establecer(['coffee']);
    servicio.establecer(['coffee', 'wine_bar']);
    const enlaces = doc.head.querySelectorAll('link#carta-material-symbols');
    expect(enlaces.length).toBe(1);
    expect(enlaces[0].getAttribute('rel')).toBe('stylesheet');
    expect(enlaces[0].getAttribute('href')).toContain('wine_bar');

    servicio.quitar();
    expect(doc.getElementById('carta-material-symbols')).toBeNull();
  });
});
