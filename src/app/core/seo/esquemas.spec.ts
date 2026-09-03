import {
  esquemaAboutPage,
  esquemaContactPage,
  esquemaListaEventos,
  esquemaLocalBusiness,
  esquemaMigasDePan,
  esquemaOrganizacion,
  esquemaSitioWeb,
} from './esquemas';

describe('esquemas JSON-LD', () => {
  it('esquemaOrganizacion trae los campos obligatorios de Organization', () => {
    const esquema = esquemaOrganizacion();
    expect(esquema['@type']).toBe('Organization');
    expect(esquema.name).toBe('Le Tiende');
    expect(esquema.url).toBe('https://letiende.co');
  });

  it('esquemaSitioWeb no declara potentialAction (no hay búsqueda real en el sitio)', () => {
    const esquema = esquemaSitioWeb();
    expect(esquema['@type']).toBe('WebSite');
    expect('potentialAction' in esquema).toBe(false);
  });

  it('esquemaLocalBusiness trae dirección estructurada y horarios, sin geo inventado', () => {
    const esquema = esquemaLocalBusiness();
    expect(esquema['@type']).toBe('PerformingArtsTheater');
    expect(esquema.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: 'Carrera 24 #37-44',
      addressLocality: 'Bogotá',
      addressCountry: 'CO',
    });
    expect(esquema.openingHoursSpecification).toContainEqual({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday'],
      opens: '14:00',
      closes: '20:00',
    });
    expect('geo' in esquema).toBe(false);
  });

  it('esquemaListaEventos ubica cada evento en el mismo teatro', () => {
    const esquema = esquemaListaEventos([
      { slug: 'evento-1', nombre: 'Evento uno', fechaHora: '2026-10-01T20:00:00.000Z' },
    ]);
    expect(esquema.itemListElement).toHaveLength(1);
    expect(esquema.itemListElement[0].item.name).toBe('Evento uno');
    expect(esquema.itemListElement[0].item.location.name).toBe('Le Tiende');
    expect(esquema.itemListElement[0].item.url).toBe(
      'https://letiende.co/cartelera/evento/evento-1',
    );
  });

  it('esquemaAboutPage y esquemaContactPage traen su url canónica', () => {
    expect(esquemaAboutPage().url).toBe('https://letiende.co/nosotros');
    expect(esquemaContactPage().url).toBe('https://letiende.co/contacto');
  });

  it('esquemaMigasDePan arma la lista posicionada', () => {
    const esquema = esquemaMigasDePan([
      { nombre: 'Inicio', ruta: '/' },
      { nombre: 'Nosotros', ruta: '/nosotros' },
    ]);
    expect(esquema.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://letiende.co/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Nosotros',
        item: 'https://letiende.co/nosotros',
      },
    ]);
  });
});
