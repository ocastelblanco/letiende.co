import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { InicioComponent } from './inicio/inicio.component';
import { MenuComponent } from './contenidos/menu/menu.component';
import { EventosComponent } from './contenidos/eventos/eventos.component';
import { AvesComponent } from './landing_pages/aves/aves.component';

const routes: Routes = [
  { path: '', redirectTo: 'eventos', pathMatch: 'full' },
  /*{ path: '', redirectTo: 'inicio', pathMatch: 'full' },*/
  /*{ path: 'inicio', component: InicioComponent },*/
  { path: 'menu', component: MenuComponent },
  { path: 'eventos', component: EventosComponent },
  { path: 'aves', component: AvesComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
