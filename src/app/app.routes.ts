import { Routes } from '@angular/router';

// El <title> lo fija MetaService (core/seo/), no la propiedad `title` de la
// ruta: así un solo servicio arma título, descripción, canónica, Open Graph
// y JSON-LD juntos, en vez de repartir el título aquí y el resto en cada
// componente (tech-specs.md §4.5, T-0008).
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/inicio/inicio').then((m) => m.InicioComponent),
    pathMatch: 'full',
  },
  {
    path: 'nosotros',
    loadComponent: () => import('./features/nosotros/nosotros').then((m) => m.NosotrosComponent),
  },
  {
    path: 'contacto',
    loadComponent: () => import('./features/contacto/contacto').then((m) => m.ContactoComponent),
  },
  {
    path: 'preguntas-frecuentes',
    loadComponent: () =>
      import('./features/preguntas-frecuentes/preguntas-frecuentes').then(
        (m) => m.PreguntasFrecuentesComponent,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/no-encontrada/no-encontrada').then((m) => m.NoEncontradaComponent),
  },
];
