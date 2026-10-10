import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { routes } from './app.routes';
import { ThemeService, getTheme } from './core/theme/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideIonicAngular(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withFetch()),
    // Hydration stays on for app-root, but <ion-app> has ngSkipHydration (see AppComponent):
    // Ionic's web components rewrite their own DOM, so hydrating them fails with NG0500.
    provideClientHydration(),
    // Restaurant theme (colours/fonts) applied before first render, on the server and in the browser.
    provideAppInitializer(() => {
      inject(ThemeService).applyTheme(getTheme());
    }),
  ],
};
