import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { PreloadAllModules, RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading } from '@angular/router';
import { IonicRouteStrategy } from '@ionic/angular/ionic-route-strategy';
import { provideIonicAngular } from '@ionic/angular/provide';
import { routes } from '@app/app.routes';
import { authTokenInterceptor } from '@interceptors/auth-token/auth-token.interceptor';

/** Browser (and base server) providers. HttpClient uses the Fetch backend by default (Rule 24). */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    provideClientHydration(),
  ],
};
