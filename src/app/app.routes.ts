import { Routes } from '@angular/router';
import { InicioComponent } from './features/inicio/inicio';
import { NosotrosComponent } from './features/nosotros/nosotros';
import { ContactoComponent } from './features/contacto/contacto';
import { PreguntasFrecuentesComponent } from './features/preguntas-frecuentes/preguntas-frecuentes';
import { NoEncontradaComponent } from './features/no-encontrada/no-encontrada';

// El <title> lo fija MetaService (core/seo/), no la propiedad `title` de la
// ruta: así un solo servicio arma título, descripción, canónica, Open Graph
// y JSON-LD juntos, en vez de repartir el título aquí y el resto en cada
// componente (tech-specs.md §4.5, T-0008).
export const routes: Routes = [
  { path: '', component: InicioComponent, pathMatch: 'full' },
  { path: 'nosotros', component: NosotrosComponent },
  { path: 'contacto', component: ContactoComponent },
  { path: 'preguntas-frecuentes', component: PreguntasFrecuentesComponent },
  { path: '**', component: NoEncontradaComponent },
];
