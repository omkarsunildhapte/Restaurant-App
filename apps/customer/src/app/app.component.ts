import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { Component, OnInit, ChangeDetectionStrategy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AlertService } from './service/alert.service';
import { SupabaseNotConfiguredError, isSupabaseConfigured } from './core/supabase.client';

@Component({
    selector: 'app-root',
    imports: [IonApp, IonRouterOutlet],
    template: `
  <!-- ngSkipHydration: Ionic components can't be hydrated (NG0500); this subtree re-renders on the client. -->
  <ion-app ngSkipHydration>
  <ion-router-outlet></ion-router-outlet>
</ion-app>
`,
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class AppComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && !isSupabaseConfigured) {
      // Visible, non-fatal: the app still renders; auth calls return this same message.
      this.alertService.presentAlert('Configuration', '', new SupabaseNotConfiguredError().message, 'warning');
    }
  }
}
