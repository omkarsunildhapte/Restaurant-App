import { ApplicationConfig, importProvidersFrom, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { IonicServerModule } from '@ionic/angular-server';
import { appConfig } from '@app/app.config';
import { serverRoutes } from '@app/app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // @ionic/angular-server 9 only ships IonicServerModule; its providers come in this way (Rule 27).
    importProvidersFrom(IonicServerModule),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
