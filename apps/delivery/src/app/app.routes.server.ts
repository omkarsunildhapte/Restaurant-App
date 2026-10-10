import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Web SSR render modes. Everything renders on the server by default.
 * track-map renders on the client only: its map comes from the Google Maps JavaScript API,
 * which needs window/document and a real DOM element to draw into, so the server would only
 * produce an empty map container and then fight hydration over it.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'track-map', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
