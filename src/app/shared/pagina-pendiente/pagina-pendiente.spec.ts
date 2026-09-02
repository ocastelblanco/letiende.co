import { TestBed } from '@angular/core/testing';
import { PaginaPendiente } from './pagina-pendiente';

describe('PaginaPendiente', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({ imports: [PaginaPendiente] }).compileComponents();
    const fixture = TestBed.createComponent(PaginaPendiente);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
