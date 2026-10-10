import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * The Supabase session lives in the browser (localStorage), so the server cannot know who
 * is signed in. The login page is rendered on the server (fast first paint); every
 * signed-in page renders in the browser, where the session and its data are.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Client },
];
