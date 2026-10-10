import { ApplicationConfig, importProvidersFrom, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { IonicServerModule } from '@ionic/angular-server';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // @ionic/angular-server 9 only ships IonicServerModule (no standalone provider function);
    // it renders Ionic's web components on the server via @ionic/core/hydrate.
    importProvidersFrom(IonicServerModule),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
