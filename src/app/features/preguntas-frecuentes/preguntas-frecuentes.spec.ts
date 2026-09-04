import { TestBed } from '@angular/core/testing';
import { PreguntasFrecuentesComponent } from './preguntas-frecuentes';

describe('PreguntasFrecuentesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreguntasFrecuentesComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PreguntasFrecuentesComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('responde sobre horarios, ubicación, parqueadero, accesibilidad y evento propio', () => {
    const fixture = TestBed.createComponent(PreguntasFrecuentesComponent);
    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent?.trim() ?? '';

    expect(texto).toContain('Domingo a miércoles');
    expect(texto).toContain('Jueves a sábado');
    expect(texto).toContain('Carrera 24 #37-44');
    expect(texto).toContain('parqueadero');
    expect(texto).toContain('movilidad reducida');
    expect(texto).toContain('accesible');
    expect(texto).toContain('WhatsApp');
    expect(texto).toContain('+57 318 7056288');
  });

  it('el enlace de WhatsApp apunta a wa.me con el número en formato E.164', () => {
    const fixture = TestBed.createComponent(PreguntasFrecuentesComponent);
    fixture.detectChanges();
    const enlace = (fixture.nativeElement as HTMLElement).querySelector(
      'a[href="https://wa.me/573187056288"]',
    );
    expect(enlace).toBeTruthy();
  });
});
