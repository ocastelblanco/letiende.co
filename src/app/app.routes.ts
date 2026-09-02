import { Routes } from '@angular/router';
import { InicioComponent } from './features/inicio/inicio';
import { PaginaPendiente } from './shared/pagina-pendiente/pagina-pendiente';

export const routes: Routes = [
  { path: '', component: InicioComponent, pathMatch: 'full', title: 'Le Tiende' },
  { path: 'nosotros', component: PaginaPendiente, title: 'Nosotros - Le Tiende' },
  { path: 'contacto', component: PaginaPendiente, title: 'Contacto - Le Tiende' },
];
