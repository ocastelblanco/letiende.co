import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // La portada depende de datos en vivo de Ágora (próximos eventos, T-0005):
  // Prerender la congelaría en el estado del último build hasta el próximo
  // despliegue. Server la vuelve a renderizar en cada petición — el orden
  // importa, tiene que ir antes del comodín (MEMORY.md §9).
  {
    path: '',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
