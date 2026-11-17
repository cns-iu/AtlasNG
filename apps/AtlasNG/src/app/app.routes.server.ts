import { RenderMode, ServerRoute } from '@angular/ssr';

/** Server render modes; every route is prerendered at build time by default. */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
