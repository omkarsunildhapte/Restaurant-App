import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  // ngSkipHydration: Ionic web components rewrite their own DOM when they upgrade, so Angular's
  // non-destructive hydration reports NG0500 mismatches. The server HTML is still shown for first
  // paint; the client then re-renders the ion-app subtree instead of hydrating it.
  template: `
    <ion-app ngSkipHydration>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
