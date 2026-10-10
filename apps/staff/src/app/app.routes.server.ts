import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * The Supabase session lives in the browser, so the server cannot know who is signed in.
 * The login page is rendered on the server; every working screen renders in the browser.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Client },
];
