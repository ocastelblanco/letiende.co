import { Routes } from '@angular/router';
import { PaginaPendiente } from './shared/pagina-pendiente/pagina-pendiente';

export const routes: Routes = [
  // Placeholder hasta T-4 (portada). Sin esto, '/' deja de tener ruta y el
  // servidor SSR responde 404 en vez de la página de inicio.
  { path: '', component: PaginaPendiente, pathMatch: 'full', title: 'Le Tiende' },
  { path: 'nosotros', component: PaginaPendiente, title: 'Nosotros - Le Tiende' },
  { path: 'contacto', component: PaginaPendiente, title: 'Contacto - Le Tiende' },
];
