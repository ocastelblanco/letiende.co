import { TestBed } from '@angular/core/testing';
import { PiePagina } from './pie-pagina';

describe('PiePagina', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PiePagina] }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PiePagina);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza contenido, no un pie vacío', () => {
    const fixture = TestBed.createComponent(PiePagina);
    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent?.trim() ?? '';
    expect(texto.length).toBeGreaterThan(0);
    expect(texto).toContain('Le Tiende');
  });
});
