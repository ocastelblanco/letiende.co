import { Routes } from '@angular/router';
import { Inicio } from '@vistas/inicio/inicio';
import { Menu } from '@vistas/menu/menu';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: Inicio, title: 'Le Tiende' },
  { path: 'menu', component: Menu, title: 'Menú Le Tiende' },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
