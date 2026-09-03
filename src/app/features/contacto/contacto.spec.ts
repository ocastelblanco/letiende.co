import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ContactoComponent } from './contacto';

function establecerTexto(elemento: HTMLInputElement | HTMLTextAreaElement, valor: string): void {
  elemento.value = valor;
  elemento.dispatchEvent(new Event('input'));
}

function marcarConsentimiento(elemento: HTMLInputElement, marcado: boolean): void {
  elemento.checked = marcado;
  elemento.dispatchEvent(new Event('change'));
}

function enviarFormulario(fixture: {
  nativeElement: HTMLElement;
  detectChanges: () => void;
}): void {
  const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
  form.dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

function bannerVisible(fixture: { nativeElement: HTMLElement }): boolean {
  return fixture.nativeElement.querySelector('[role="status"], [role="alert"]') !== null;
}

function llenarFormularioValido(el: HTMLElement): void {
  establecerTexto(el.querySelector('#nombre') as HTMLInputElement, 'Visitante');
  establecerTexto(el.querySelector('#correo') as HTMLInputElement, 'visitante@correo.com');
  establecerTexto(el.querySelector('#mensaje') as HTMLTextAreaElement, 'Hola, quiero saber más.');
  marcarConsentimiento(el.querySelector('#consentimientoDatos') as HTMLInputElement, true);
}

describe('ContactoComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    const fixture = TestBed.createComponent(ContactoComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra la dirección y los horarios reales, no "por confirmar"', () => {
    const fixture = TestBed.createComponent(ContactoComponent);
    fixture.detectChanges();
    const texto = fixture.nativeElement.textContent ?? '';
    expect(texto).toContain('Carrera 24 #37-44');
    expect(texto).toContain('Domingo a miércoles');
  });

  it('el campo honeypot existe pero está oculto de un humano real', () => {
    const fixture = TestBed.createComponent(ContactoComponent);
    fixture.detectChanges();
    const campo = fixture.nativeElement.querySelector('#sitioWeb') as HTMLInputElement;
    expect(campo).toBeTruthy();
    expect(campo.getAttribute('tabindex')).toBe('-1');
    expect(campo.closest('[aria-hidden="true"]')).toBeTruthy();
  });

  it('bloquea el envío si el nombre está vacío', () => {
    const fixture = TestBed.createComponent(ContactoComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement;

    establecerTexto(el.querySelector('#correo'), 'visitante@correo.com');
    establecerTexto(el.querySelector('#mensaje'), 'Hola, quiero saber más.');
    marcarConsentimiento(el.querySelector('#consentimientoDatos'), true);

    enviarFormulario(fixture);

    expect(bannerVisible(fixture)).toBe(false);
    expect(el.textContent).toContain('El nombre es obligatorio.');
    httpMock.expectNone('/api/contacto');
  });

  it('bloquea el envío si el correo no es válido', () => {
    const fixture = TestBed.createComponent(ContactoComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement;

    establecerTexto(el.querySelector('#nombre'), 'Visitante');
    establecerTexto(el.querySelector('#correo'), 'no-es-un-correo');
    establecerTexto(el.querySelector('#mensaje'), 'Hola, quiero saber más.');
    marcarConsentimiento(el.querySelector('#consentimientoDatos'), true);

    enviarFormulario(fixture);

    expect(bannerVisible(fixture)).toBe(false);
    expect(el.textContent).toContain('El correo no es válido.');
    httpMock.expectNone('/api/contacto');
  });

  it('bloquea el envío si el consentimiento no está marcado', () => {
    const fixture = TestBed.createComponent(ContactoComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement;

    establecerTexto(el.querySelector('#nombre'), 'Visitante');
    establecerTexto(el.querySelector('#correo'), 'visitante@correo.com');
    establecerTexto(el.querySelector('#mensaje'), 'Hola, quiero saber más.');

    enviarFormulario(fixture);

    expect(bannerVisible(fixture)).toBe(false);
    expect(el.textContent).toContain('Debes aceptar el tratamiento de datos');
    httpMock.expectNone('/api/contacto');
  });

  it('con el formulario válido, hace POST /api/contacto de verdad y muestra el aviso de éxito', () => {
    const fixture = TestBed.createComponent(ContactoComponent);
    fixture.detectChanges();
    llenarFormularioValido(fixture.nativeElement);

    enviarFormulario(fixture);

    const peticion = httpMock.expectOne('/api/contacto');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      nombre: 'Visitante',
      correo: 'visitante@correo.com',
      mensaje: 'Hola, quiero saber más.',
      consentimientoDatos: true,
      sitioWeb: '',
    });

    peticion.flush({ enviado: true });
    fixture.detectChanges();

    expect(bannerVisible(fixture)).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Mensaje enviado');
  });

  it('si el backend falla, muestra un aviso de error genérico, sin inventar una causa', () => {
    const fixture = TestBed.createComponent(ContactoComponent);
    fixture.detectChanges();
    llenarFormularioValido(fixture.nativeElement);

    enviarFormulario(fixture);

    const peticion = httpMock.expectOne('/api/contacto');
    peticion.flush({ error: 'boom' }, { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    expect(bannerVisible(fixture)).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('No se pudo enviar el mensaje');
  });
});
