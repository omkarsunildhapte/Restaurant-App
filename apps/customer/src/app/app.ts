import { Component, DOCUMENT, afterNextRender, inject } from '@angular/core';
import { IonApp } from '@ionic/angular/ion-app';
import { IonRouterOutlet } from '@ionic/angular/ion-router-outlet';
import { environment } from '@environments/environment';
import { APP_READY } from '@constants/app.constants';
import { ALERT_TITLES, ERROR_MESSAGES } from '@constants/messages.constants';
import { AlertService } from '@services/alert/alert.service';
import { isSupabaseConfigured } from '@services/supabase/supabase.service';

/** Root component: the Ionic app and its router outlet. */
@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly alerts = inject(AlertService);
  private readonly doc = inject(DOCUMENT);

  constructor() {
    afterNextRender(() => {
      // The client has replaced the server-rendered <ion-app> (ngSkipHydration): e2e tests wait
      // for this marker so they never see the server copy and the client copy at once.
      this.doc.documentElement.setAttribute(APP_READY.ATTRIBUTE, APP_READY.VALUE);
      // Visible but non-fatal: the app still renders and auth calls return the same message.
      if (!isSupabaseConfigured()) void this.alerts.present(ALERT_TITLES.CONFIGURATION, ERROR_MESSAGES.supabaseNotConfigured(environment.name), 'warning');
    });
  }
}
