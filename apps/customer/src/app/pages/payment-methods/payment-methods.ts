import { Component } from '@angular/core';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';

/** Saved payment methods (empty until payments are wired). */
@Component({
  selector: 'app-payment-methods',
  imports: [IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar],
  templateUrl: './payment-methods.html',
  styleUrl: './payment-methods.css',
})
export class PaymentMethods {
  readonly links = APP_ROUTE_LINKS;
}
