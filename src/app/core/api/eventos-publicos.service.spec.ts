import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@environments/environment';
import { EventoEnCartelera, EventosPublicosService } from './eventos-publicos.service';

describe('EventosPublicosService', () => {
  let httpMock: HttpTestingController;
  let appRef: ApplicationRef;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    appRef = TestBed.inject(ApplicationRef);
  });

  afterEach(() => httpMock.verify());

  it('pide el arreglo de eventos públicos de Ágora, sin envoltorio', async () => {
    const servicio = TestBed.inject(EventosPublicosService);
    TestBed.tick(); // dispara el efecto interno del recurso, sin esperar la respuesta

    const eventosFalsos: EventoEnCartelera[] = [
      { slug: 'evento-1', nombre: 'Evento uno', fechaHora: '2026-10-01T20:00:00.000Z' },
    ];

    // La petición ya está en vuelo apenas se inyecta el servicio (el recurso
    // se dispara reactivamente) — no se puede esperar whenStable() antes de
    // resolverla: esa misma petición pendiente es lo que la mantiene inestable.
    const peticion = httpMock.expectOne(`${environment.urlBaseApiAgora}/api/eventos-publicos`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush(eventosFalsos);
    await appRef.whenStable();

    expect(servicio.cartelera.value()).toEqual(eventosFalsos);
  });

  it('no lanza si Ágora no responde: el recurso queda en error, no en excepción', async () => {
    TestBed.inject(EventosPublicosService);
    TestBed.tick();

    const peticion = httpMock.expectOne(`${environment.urlBaseApiAgora}/api/eventos-publicos`);
    peticion.error(new ProgressEvent('network error'));
    await expect(appRef.whenStable()).resolves.not.toThrow();
  });
});
