import { Routes } from '@angular/router';
import { Inicio } from '@vistas/inicio/inicio';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: Inicio, title: 'Le Tiende' },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
