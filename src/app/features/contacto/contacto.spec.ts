import { TestBed } from '@angular/core/testing';
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
  return fixture.nativeElement.querySelector('[role="status"]') !== null;
}

describe('ContactoComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ContactoComponent] }).compileComponents();
  });

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
  });

  it('con el formulario válido, deja evidencia visible de que el backend todavía no está conectado', () => {
    const fixture = TestBed.createComponent(ContactoComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement;

    establecerTexto(el.querySelector('#nombre'), 'Visitante');
    establecerTexto(el.querySelector('#correo'), 'visitante@correo.com');
    establecerTexto(el.querySelector('#mensaje'), 'Hola, quiero saber más.');
    marcarConsentimiento(el.querySelector('#consentimientoDatos'), true);

    enviarFormulario(fixture);

    expect(bannerVisible(fixture)).toBe(true);
    expect(el.textContent).toContain('todavía no está conectado');
  });
});
