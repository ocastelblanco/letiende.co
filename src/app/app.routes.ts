import { Routes } from '@angular/router';
import { Inicio } from '@vistas/inicio/inicio';
import { Menu } from '@vistas/menu/menu';
import { Admin } from '@vistas/admin/admin';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: Inicio, title: 'Le Tiende' },
  { path: 'menu', component: Menu, title: 'Menú Le Tiende', data: { preload: true } },
  { path: 'menu/:categoria', component: Menu, title: 'Menú Le Tiende', data: { preload: true } },
  { path: 'admin', component: Admin, title: 'Administración - Le Tiende', canActivate: [authGuard] },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
