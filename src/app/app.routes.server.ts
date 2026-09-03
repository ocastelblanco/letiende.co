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
  // Contenido estático: se prerenderizan por nombre exacto, no caen en el
  // comodín de abajo (que ahora es Server, no Prerender — T-0008).
  {
    path: 'nosotros',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'contacto',
    renderMode: RenderMode.Prerender,
  },
  // Cualquier ruta no listada arriba: NoEncontradaComponent, renderizado por
  // petición con HTTP 404 real — una "página en construcción" que responde
  // 200 hace que los buscadores indexen basura (CLAUDE.md §5, A05,
  // tech-specs.md §4.2). `status` es la forma soportada por @angular/ssr
  // para fijar el código de estado de una ServerRoute.
  {
    path: '**',
    renderMode: RenderMode.Server,
    status: 404,
  },
];
