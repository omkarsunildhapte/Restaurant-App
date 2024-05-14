import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp,initializeApp } from "@angular/fire/app";
import { provideAuth,getAuth } from "@angular/fire/auth";
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { environment } from '../environments/environment.development';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideClientHydration(),
    importProvidersFrom([
      provideFirebaseApp(()=>initializeApp(environment.firebase)),
      provideAuth(()=> getAuth())
    ]), provideAnimationsAsync()
  ]
};
