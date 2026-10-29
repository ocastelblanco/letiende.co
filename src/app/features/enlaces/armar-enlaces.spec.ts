import { ETIQUETA_GENERICA, ETIQUETAS_ICONO, EnlacesArmados, armarEnlaces } from './armar-enlaces';

// Las cinco filas reales de la hoja (27/10/2026), tal como las publica el script.
const contenidoReal = {
  publicadoEn: '2026-10-27T21:00:00.000Z',
  paneles: [
    {
      titulo: 'Pódbar',
      descripcion: 'Conversaciones de barra sobre música y cultura',
      logo: 'podbar',
      barras: [
        {
          titulo: 'T3',
          enlaces: [
            { icono: 'youtube', url: 'https://www.youtube.com/@P%C3%B3dbar-bar23', etiqueta: '' },
            {
              icono: 'spotify',
              url: 'https://open.spotify.com/show/5Yd0euqLaHhCZxY3wqsUd4',
              etiqueta: '',
            },
            {
              icono: 'apple',
              url: 'https://podcasts.apple.com/co/podcast/p%C3%B3dbar/id6826332915',
              etiqueta: '',
            },
          ],
        },
        {
          titulo: 'T1 y T2',
          enlaces: [
            { icono: 'mixcloud', url: 'https://www.mixcloud.com/bar23/', etiqueta: '' },
            { icono: 'bar23', url: 'https://bar23.co/podbar', etiqueta: '' },
          ],
        },
      ],
    },
  ],
};

function panelConEnlace(enlace: unknown, extras: Record<string, unknown> = {}) {
  return {
    paneles: [{ titulo: 'Panel', ...extras, barras: [{ titulo: 'Barra', enlaces: [enlace] }] }],
  };
}

function primerEnlace(armados: EnlacesArmados) {
  return armados.paneles[0]?.barras[0]?.enlaces[0];
}

describe('armarEnlaces', () => {
  it('arma el contenido real: un panel, dos barras, 3 + 2 enlaces, en el orden de la hoja', () => {
    const { paneles } = armarEnlaces(contenidoReal);

    expect(paneles).toHaveLength(1);
    expect(paneles[0].titulo).toBe('Pódbar');
    expect(paneles[0].logo).toBe('podbar');
    expect(paneles[0].descripcion).toBe('Conversaciones de barra sobre música y cultura');
    expect(paneles[0].barras.map((b) => b.titulo)).toEqual(['T3', 'T1 y T2']);
    expect(paneles[0].barras[0].enlaces.map((e) => e.icono)).toEqual([
      'youtube',
      'spotify',
      'apple',
    ]);
    expect(paneles[0].barras[1].enlaces.map((e) => e.icono)).toEqual(['mixcloud', 'bar23']);
  });

  it('conserva la URL exactamente como llegó (sin recodificarla)', () => {
    expect(primerEnlace(armarEnlaces(contenidoReal))?.url).toBe(
      'https://www.youtube.com/@P%C3%B3dbar-bar23',
    );
  });

  it('con etiqueta vacía usa la del ícono; con etiqueta propia usa esa', () => {
    expect(primerEnlace(armarEnlaces(contenidoReal))?.etiqueta).toBe(ETIQUETAS_ICONO.youtube);

    const propia = armarEnlaces(
      panelConEnlace({
        icono: 'spotify',
        url: 'https://open.spotify.com/x',
        etiqueta: 'Temporada 3 en Spotify',
      }),
    );
    expect(primerEnlace(propia)?.etiqueta).toBe('Temporada 3 en Spotify');
  });

  it('un ícono desconocido cae al genérico con la etiqueta genérica', () => {
    const armados = armarEnlaces(panelConEnlace({ icono: 'tiktok', url: 'https://tiktok.com/@x' }));
    expect(primerEnlace(armados)).toEqual({
      icono: 'enlace',
      url: 'https://tiktok.com/@x',
      etiqueta: ETIQUETA_GENERICA,
    });
  });

  it('una clave de ícono que parece una ruta nunca llega al resultado', () => {
    const armados = armarEnlaces(
      panelConEnlace({ icono: '../../etc/passwd', url: 'https://a.co/x' }),
    );
    expect(primerEnlace(armados)?.icono).toBe('enlace');
  });

  it.each([
    ['http', 'http://inseguro.com/x'],
    ['javascript', 'javascript:alert(1)'],
    ['data', 'data:text/html,<script>alert(1)</script>'],
    ['sin esquema', 'bar23.co/podbar'],
    ['con credenciales', 'https://usuario:clave@sitio.com/x'],
    ['vacía', ''],
  ])('descarta el enlace con URL %s', (_nombre, url) => {
    expect(armarEnlaces(panelConEnlace({ icono: 'youtube', url })).paneles).toEqual([]);
  });

  it('descarta un enlace cuya URL no es texto', () => {
    expect(armarEnlaces(panelConEnlace({ icono: 'youtube', url: 42 })).paneles).toEqual([]);
  });

  it('descarta los enlaces con visible: false y conserva los demás', () => {
    const armados = armarEnlaces({
      paneles: [
        {
          titulo: 'Panel',
          barras: [
            {
              titulo: 'Barra',
              enlaces: [
                { icono: 'youtube', url: 'https://youtube.com/a', visible: false },
                { icono: 'spotify', url: 'https://open.spotify.com/b' },
              ],
            },
          ],
        },
      ],
    });
    expect(armados.paneles[0].barras[0].enlaces.map((e) => e.icono)).toEqual(['spotify']);
  });

  it('descarta barras sin enlaces válidos y paneles sin barras', () => {
    const armados = armarEnlaces({
      paneles: [
        { titulo: 'Vacío', barras: [] },
        {
          titulo: 'Solo inválidos',
          barras: [{ titulo: 'B', enlaces: [{ icono: 'x', url: 'http://a.co' }] }],
        },
        {
          titulo: 'Bueno',
          barras: [
            { titulo: 'Sin enlaces', enlaces: [] },
            { titulo: 'Con enlace', enlaces: [{ icono: 'bar23', url: 'https://bar23.co' }] },
          ],
        },
      ],
    });
    expect(armados.paneles.map((p) => p.titulo)).toEqual(['Bueno']);
    expect(armados.paneles[0].barras.map((b) => b.titulo)).toEqual(['Con enlace']);
  });

  it('descarta paneles y barras sin título', () => {
    expect(
      armarEnlaces(panelConEnlace({ icono: 'bar23', url: 'https://bar23.co' }, { titulo: '  ' }))
        .paneles,
    ).toEqual([]);
  });

  it('un logo desconocido (o con forma de ruta) se vuelve null; el panel se conserva', () => {
    const base = { icono: 'bar23', url: 'https://bar23.co' };
    expect(armarEnlaces(panelConEnlace(base, { logo: 'otro' })).paneles[0].logo).toBeNull();
    expect(armarEnlaces(panelConEnlace(base, { logo: '../x' })).paneles[0].logo).toBeNull();
    expect(armarEnlaces(panelConEnlace(base, { logo: null })).paneles[0].logo).toBeNull();
    expect(armarEnlaces(panelConEnlace(base, { logo: 'PODBAR' })).paneles[0].logo).toBe('podbar');
  });

  it('la descripción del panel falta, no es texto o se recorta a 160 caracteres', () => {
    const base = { icono: 'bar23', url: 'https://bar23.co' };
    expect(armarEnlaces(panelConEnlace(base)).paneles[0].descripcion).toBe('');
    expect(armarEnlaces(panelConEnlace(base, { descripcion: 42 })).paneles[0].descripcion).toBe('');
    expect(
      armarEnlaces(panelConEnlace(base, { descripcion: 'x'.repeat(500) })).paneles[0].descripcion,
    ).toHaveLength(160);
  });

  it('recorta los textos largos', () => {
    const armados = armarEnlaces(
      panelConEnlace({ icono: 'bar23', url: 'https://bar23.co', etiqueta: 'x'.repeat(500) }),
    );
    expect(primerEnlace(armados)?.etiqueta).toHaveLength(80);
  });

  it.each([null, undefined, 'texto', 42, [], {}, { paneles: 'no' }, { paneles: [null, 3, 'x'] }])(
    'una fuente irreconocible (%j) da cero paneles, sin lanzar',
    (fuente) => {
      expect(armarEnlaces(fuente)).toEqual({ paneles: [] });
    },
  );

  it('el resultado es un objeto plano que sobrevive a JSON (TransferState)', () => {
    const armados = armarEnlaces(contenidoReal);
    expect(JSON.parse(JSON.stringify(armados))).toEqual(armados);
  });
});
