import { Routes } from '@angular/router';
import { Inicio } from '@vistas/inicio/inicio';
import { Menu } from '@vistas/menu/menu';
import { Eventos } from '@vistas/eventos/eventos';
import { Admin } from '@vistas/admin/admin';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: Inicio, title: 'Le Tiende' },
  { path: 'menu', component: Menu, title: 'Menu Le Tiende', data: { preload: true } },
  { path: 'menu/:categoria', component: Menu, title: 'Menu Le Tiende', data: { preload: true } },
  { path: 'eventos', component: Eventos, title: 'Eventos - Le Tiende', data: { preload: true } },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      { path: '', component: Admin, title: 'Administracion - Le Tiende' },
      {
        path: 'eventos',
        loadComponent: () => import('@vistas/admin/eventos/admin-eventos').then(m => m.AdminEventos),
        title: 'Administrar Eventos - Le Tiende',
      },
      {
        path: 'menu',
        loadComponent: () => import('@vistas/admin/menu/admin-menu').then(m => m.AdminMenu),
        canActivate: [authGuard],
        title: 'Administrar Menú - Le Tiende',
      },
    ],
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
