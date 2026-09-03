import { TestBed } from '@angular/core/testing';
import { NosotrosComponent } from './nosotros';

describe('NosotrosComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NosotrosComponent] }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NosotrosComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('describe qué es Le Tiende, no una página vacía', () => {
    const fixture = TestBed.createComponent(NosotrosComponent);
    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent?.trim() ?? '';
    expect(texto).toContain('centro cultural');
    expect(texto).toContain('teatro');
    expect(texto).toContain('librería');
  });

  it('enlaza a /cartelera y a /libros con <a> planos, no routerLink', () => {
    const fixture = TestBed.createComponent(NosotrosComponent);
    fixture.detectChanges();
    const enlaces = (fixture.nativeElement as HTMLElement).querySelectorAll('a');
    const hrefs = Array.from(enlaces).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/cartelera');
    expect(hrefs).toContain('/libros');
  });
});
