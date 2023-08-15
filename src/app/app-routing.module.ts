import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { InicioComponent } from './inicio/inicio.component';
import { MenuComponent } from './contenidos/menu/menu.component';
import { EventosComponent } from './contenidos/eventos/eventos.component';

const routes: Routes = [
  { path: '', redirectTo: 'eventos', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'eventos', component: EventosComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
