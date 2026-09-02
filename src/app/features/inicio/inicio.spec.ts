import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@environments/environment';
import { EventoEnCartelera } from '@core/api/eventos-publicos.service';
import { InicioComponent } from './inicio';

describe('InicioComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('muestra hasta 3 próximos eventos cuando Ágora responde', async () => {
    const fixture = TestBed.createComponent(InicioComponent);
    fixture.detectChanges();

    const cincoEventos: EventoEnCartelera[] = Array.from({ length: 5 }, (_, i) => ({
      slug: `evento-${i}`,
      nombre: `Evento ${i}`,
      fechaHora: '2026-10-01T20:00:00.000Z',
    }));

    httpMock.expectOne(`${environment.urlBaseApiAgora}/api/eventos-publicos`).flush(cincoEventos);
    await fixture.whenStable();
    fixture.detectChanges();

    const tarjetas = fixture.nativeElement.querySelectorAll('li');
    expect(tarjetas.length).toBe(3);
  });

  it('se renderiza sin la sección de eventos si Ágora no responde, sin fallar', async () => {
    const fixture = TestBed.createComponent(InicioComponent);
    fixture.detectChanges();

    const peticion = httpMock.expectOne(`${environment.urlBaseApiAgora}/api/eventos-publicos`);
    peticion.error(new ProgressEvent('network error'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#titulo-proximos-eventos')).toBeNull();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Le Tiende');
  });
});
