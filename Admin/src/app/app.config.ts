import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { getAuth, provideAuth } from "@angular/fire/auth";
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment.development';
import { routes } from './app.routes';
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideClientHydration(),
    importProvidersFrom([
      provideFirebaseApp(()=>initializeApp(environment.firebase)),
      provideFirestore(()=>getFirestore()),
      provideAuth(()=> getAuth())
    ]), 
    provideAnimationsAsync(),
  ]
};
