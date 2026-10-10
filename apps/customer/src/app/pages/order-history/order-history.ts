import { Component, signal } from '@angular/core';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButton } from '@ionic/angular/ion-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonItem } from '@ionic/angular/ion-item';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonList } from '@ionic/angular/ion-list';
import { IonSegment } from '@ionic/angular/ion-segment';
import { IonSegmentButton } from '@ionic/angular/ion-segment-button';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { HistorySegment, ORDER_HISTORY_PAGE } from '@constants/order-history.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';

/** Past orders and table bookings (placeholder cards until order history is wired). */
@Component({
  selector: 'app-order-history',
  imports: [IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonItem, IonLabel, IonList, IonSegment, IonSegmentButton, IonTitle, IonToolbar],
  templateUrl: './order-history.html',
  styleUrl: './order-history.css',
})
export class OrderHistory {
  readonly copy = ORDER_HISTORY_PAGE;
  readonly links = APP_ROUTE_LINKS;
  readonly segment = signal<HistorySegment>(ORDER_HISTORY_PAGE.DEFAULT_SEGMENT);

  onSegmentChange(event: Event): void {
    const value = (event as CustomEvent<{ value?: string | number }>).detail.value;
    if (value === 'table' || value === 'order') this.segment.set(value);
  }
}
