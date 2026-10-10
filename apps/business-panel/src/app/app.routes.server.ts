import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Rendered on the server per request, except the signed-in Business panel (rendered in the
 * browser). Pages that use browser-only APIs guard them.
 */
export const serverRoutes: ServerRoute[] = [
  // Business panel: the Supabase session lives in the browser, so a server render is an empty shell.
  { path: 'business/**', renderMode: RenderMode.Client },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
