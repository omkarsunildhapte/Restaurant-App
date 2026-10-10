import { Component, computed, inject } from '@angular/core';
import { IonButton } from '@ionic/angular/ion-button';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonItem } from '@ionic/angular/ion-item';
import { IonList } from '@ionic/angular/ion-list';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { AuthService } from '@services/auth/auth.service';
import { NavigationService } from '@services/navigation/navigation.service';
import { ShiftService } from '@services/shift/shift.service';
import { ACCOUNT_PAGE } from '@constants/account.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';

/** The rider's profile: name from the Supabase session, settings lists, and sign-out. */
@Component({
  selector: 'app-account',
  imports: [IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonItem, IonList, IonTitle, IonToolbar],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account {
  private readonly auth = inject(AuthService);
  private readonly navigation = inject(NavigationService);
  private readonly shift = inject(ShiftService);

  readonly page = ACCOUNT_PAGE;
  readonly displayName = computed(() => this.auth.displayName() || this.auth.email());
  readonly initial = computed(() => this.displayName().charAt(0).toUpperCase() || ACCOUNT_PAGE.FALLBACK_INITIAL);

  /** Goes offline first, so the restaurant does not count on a signed-out rider. */
  async logout(): Promise<void> {
    if (this.shift.online()) {
      await this.shift.goOffline();
    }
    this.shift.stop();
    await this.auth.logout();
    await this.navigation.root(APP_ROUTE_LINKS.LOGIN);
  }
}
