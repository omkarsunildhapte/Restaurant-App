import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { ACCOUNT_MENU } from '@constants/navigation.constants';
import { AuthService } from '@services/auth/auth.service';

/** Account tab: the customer's name and the account menus. */
@Component({
  selector: 'app-account',
  imports: [RouterLink, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonItem, IonList, IonTitle, IonToolbar],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account {
  readonly menu = ACCOUNT_MENU;
  readonly displayName = inject(AuthService).displayName;
  readonly initial = computed(() => this.displayName().charAt(0));
}
