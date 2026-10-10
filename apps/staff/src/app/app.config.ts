import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { SessionStore } from '@app/core/session.store';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // No zone.js: change detection runs from signals and events (state lives in signals).
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(),
    // Restore the Supabase session and the remembered outlet before the first route.
    provideAppInitializer(() => inject(SessionStore).init()),
    // Offline mode, part 1: the service worker keeps the app itself on the device, so it opens
    // and reloads without internet (part 2, the data, is core/outbox.ts and the cached menu/floor).
    // Off in dev builds; on in production, staging and local (ng build --configuration local).
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:10000' }),
  ],
};
