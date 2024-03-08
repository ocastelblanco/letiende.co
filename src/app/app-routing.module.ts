import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { environment } from 'src/environments/environment';

import { InicioComponent } from './inicio/inicio.component';
import { MenuComponent } from './contenidos/menu/menu.component';
import { EventosComponent } from './contenidos/eventos/eventos.component';
import { AvesComponent } from './landing_pages/aves/aves.component';
import { DiscosComponent } from './contenidos/discos/discos.component';
import { MuertosComponent } from './landing_pages/muertos/muertos.component';
import { LibrosComponent } from './contenidos/libros/libros.component';
import { AuditorioComponent } from './contenidos/auditorio/auditorio.component';

const routes: Routes = [
  { path: 'menu', component: MenuComponent, title: 'Menú · Le Tiende' },
  { path: 'eventos', component: EventosComponent, title: 'Eventos · Le Tiende' },
  { path: 'discos', component: DiscosComponent, title: 'Discos · Le Tiende' },
  { path: 'libros', component: LibrosComponent, title: 'Libros · Le Tiende' },
  { path: 'auditorio', redirectTo: 'auditorio/presentacion', pathMatch: 'full' },
  { path: 'auditorio/:item', component: AuditorioComponent, title: 'Auditorio · Le Tiende' },
  { path: '', redirectTo: 'eventos', pathMatch: 'full' },
  { path: '**', redirectTo: 'eventos', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent, title: 'Le Tiende' },
  { path: 'aves', component: AvesComponent, title: 'Objetivo: Aves' },
  { path: 'muertos', component: MuertosComponent, title: 'Fiesta de Muertos · Le Tiende' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
