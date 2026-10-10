import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { PreloadAllModules, RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { IonicRouteStrategy } from '@ionic/angular/ionic-route-strategy';
import { provideIonicAngular } from '@ionic/angular/provide';
import { routes } from '@app/app.routes';
import { apiAuthInterceptor } from '@interceptors/api-auth/api-auth.interceptor';
import { ThemeService } from '@services/theme/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideIonicAngular(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    // Fetch is the default backend in Angular 22 (no withFetch(), Rule 24).
    provideHttpClient(withInterceptors([apiAuthInterceptor])),
    // Hydration stays on for app-root; <ion-app> has ngSkipHydration (see app.html).
    provideClientHydration(),
    // Restaurant theme applied before first render, on the server and in the browser.
    provideAppInitializer(() => {
      const theme = inject(ThemeService);
      theme.applyTheme(theme.getTheme());
    }),
  ],
};
