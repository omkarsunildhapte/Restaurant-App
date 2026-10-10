import { ApplicationConfig, importProvidersFrom, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { IonicServerModule } from '@ionic/angular-server';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // @ionic/angular-server only ships IonicServerModule; its providers (hydrating Ionic's
    // web components into the server HTML) are pulled in with importProvidersFrom.
    importProvidersFrom(IonicServerModule),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
