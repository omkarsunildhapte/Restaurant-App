import { Component, computed, inject, resource, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonItem } from '@ionic/angular/ion-item';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonList } from '@ionic/angular/ion-list';
import { IonSegment } from '@ionic/angular/ion-segment';
import { IonSegmentButton } from '@ionic/angular/ion-segment-button';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import type { SegmentCustomEvent } from '@ionic/angular';
import { OrdersService } from '@services/orders/orders.service';
import { OrderSegment } from '@appTypes/order.types';
import { ORDER_PAGE } from '@constants/order.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';

/** The rider's orders, Active / History. The list is a Phase 5 stub, so it shows the empty state. */
@Component({
  selector: 'app-order',
  imports: [CurrencyPipe, IonBackButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonSegment, IonSegmentButton, IonTitle, IonToolbar],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class Order {
  private readonly ordersService = inject(OrdersService);

  readonly page = ORDER_PAGE;
  readonly backLink = APP_ROUTE_LINKS.PERSONAL_DOCUMENT;

  readonly segment = signal<OrderSegment>(ORDER_PAGE.DEFAULT_SEGMENT);
  readonly emptyText = computed(() => ORDER_PAGE.SEGMENTS.find((tab) => tab.value === this.segment())?.emptyText ?? '');

  readonly orders = resource({
    params: () => this.segment(),
    loader: ({ params }) => this.ordersService.listOrders(params),
    defaultValue: [],
  });

  /** Never throws: an errored load shows the empty state instead (Rule 8). */
  readonly list = computed(() => (this.orders.hasValue() ? this.orders.value() : []));

  onSegmentChange(event: SegmentCustomEvent): void {
    const value = ORDER_PAGE.SEGMENTS.find((tab) => tab.value === event.detail.value)?.value;
    if (value) {
      this.segment.set(value);
    }
  }
}
