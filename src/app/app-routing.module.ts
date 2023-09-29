import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { InicioComponent } from './inicio/inicio.component';
import { MenuComponent } from './contenidos/menu/menu.component';
import { EventosComponent } from './contenidos/eventos/eventos.component';
import { AvesComponent } from './landing_pages/aves/aves.component';
import { DiscosComponent } from './contenidos/discos/discos.component';

const routes: Routes = [
  { path: '', redirectTo: 'eventos', pathMatch: 'full' },
  /*{ path: '', redirectTo: 'inicio', pathMatch: 'full' },*/
  { path: 'menu', component: MenuComponent, title: 'Menú Le Tiende' },
  { path: 'eventos', component: EventosComponent, title: 'Eventos Le Tiende' },
  { path: 'aves', component: AvesComponent, title: 'Objetivo: Aves' },
  { path: 'discos', component: DiscosComponent, title: 'Nuestros discos' },
  { path: '**', redirectTo: 'eventos', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
