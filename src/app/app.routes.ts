import { Routes } from '@angular/router';
import { InicioComponent } from './features/inicio/inicio';
import { NosotrosComponent } from './features/nosotros/nosotros';
import { ContactoComponent } from './features/contacto/contacto';

export const routes: Routes = [
  { path: '', component: InicioComponent, pathMatch: 'full', title: 'Le Tiende' },
  { path: 'nosotros', component: NosotrosComponent, title: 'Nosotros - Le Tiende' },
  { path: 'contacto', component: ContactoComponent, title: 'Contacto - Le Tiende' },
];
