import { TestBed } from '@angular/core/testing';
import { NoEncontradaComponent } from './no-encontrada';

describe('NoEncontradaComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NoEncontradaComponent] }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NoEncontradaComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('avisa que la página no existe y ofrece un enlace de vuelta', () => {
    const fixture = TestBed.createComponent(NoEncontradaComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('404');
    expect(el.querySelector('a[href="/"]')).toBeTruthy();
  });
});
