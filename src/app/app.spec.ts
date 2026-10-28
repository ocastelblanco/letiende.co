import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('monta la barra de navegación y el pie de página comunes', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-barra-navegacion')).toBeTruthy();
    expect(compiled.querySelector('app-pie-pagina')).toBeTruthy();
  });

  it('en una ruta con sinMarco no monta ni la barra ni el pie', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/enlaces');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-barra-navegacion')).toBeNull();
    expect(compiled.querySelector('app-pie-pagina')).toBeNull();
  });

  it('al volver a una ruta normal, la barra y el pie reaparecen', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/enlaces');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await router.navigateByUrl('/nosotros');
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-barra-navegacion')).toBeTruthy();
    expect(compiled.querySelector('app-pie-pagina')).toBeTruthy();
  });
});
