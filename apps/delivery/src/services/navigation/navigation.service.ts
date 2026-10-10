import { Injectable, inject } from '@angular/core';
import { NavController } from '@ionic/angular/nav-controller';

/**
 * Programmatic navigation after an action completes (sign-in, a saved onboarding step), with
 * Ionic's forward page transition. Links in templates use [routerLink] instead.
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly navController = inject(NavController);

  forward(url: string): Promise<boolean> {
    return this.navController.navigateForward(url);
  }

  /** Replaces the history entry (e.g. leaving a screen the rider must not go back to). */
  root(url: string): Promise<boolean> {
    return this.navController.navigateRoot(url);
  }
}
