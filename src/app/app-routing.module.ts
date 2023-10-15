import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { InicioComponent } from './inicio/inicio.component';
import { MenuComponent } from './contenidos/menu/menu.component';
import { EventosComponent } from './contenidos/eventos/eventos.component';
import { AvesComponent } from './landing_pages/aves/aves.component';
import { DiscosComponent } from './contenidos/discos/discos.component';
import { MuertosComponent } from './landing_pages/muertos/muertos.component';

const routes: Routes = [
  { path: 'menu', component: MenuComponent, title: 'Menú · Le Tiende' },
  { path: 'eventos', component: EventosComponent, title: 'Eventos · Le Tiende' },
  { path: 'muertos', component: MuertosComponent, title: 'Fiesta de Muertos · Le Tiende' },
  { path: '', redirectTo: 'eventos', pathMatch: 'full' },
  { path: '**', redirectTo: 'eventos', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
  { path: 'discos', component: DiscosComponent, title: 'Nuestros discos' },
  { path: 'aves', component: AvesComponent, title: 'Objetivo: Aves' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
