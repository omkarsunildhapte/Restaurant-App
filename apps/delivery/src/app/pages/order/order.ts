import { Component, OnInit, computed, inject, resource, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButton } from '@ionic/angular/ion-button';
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
import { IonToggle } from '@ionic/angular/ion-toggle';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import type { SegmentCustomEvent, ToggleCustomEvent } from '@ionic/angular';
import { OrdersService } from '@services/orders/orders.service';
import { ShiftService } from '@services/shift/shift.service';
import { AlertService } from '@services/alert/alert.service';
import { OrderSegment, RiderOrder } from '@appTypes/order.types';
import { IN_PROGRESS_STATUSES, OFFER_STATUS, ORDER_PAGE } from '@constants/order.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { onlineBlockMessage } from '@utils/rider-status/rider-status.util';

/**
 * The rider's jobs, Active / History, and the online switch. An offer is accepted or turned
 * down here; a job in progress opens on the track-map page. The list reloads by itself when the
 * restaurant assigns or cancels a job (ShiftService.jobsVersion, over Realtime).
 */
@Component({
  selector: 'app-order',
  imports: [CurrencyPipe, RouterLink, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonSegment, IonSegmentButton, IonTitle, IonToggle, IonToolbar],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class Order implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly alerts = inject(AlertService);
  readonly shift = inject(ShiftService);

  readonly page = ORDER_PAGE;
  readonly backLink = APP_ROUTE_LINKS.PERSONAL_DOCUMENT;
  readonly trackLink = APP_ROUTE_LINKS.TRACK_MAP;

  readonly segment = signal<OrderSegment>(ORDER_PAGE.DEFAULT_SEGMENT);
  readonly emptyText = computed(() => ORDER_PAGE.SEGMENTS.find((tab) => tab.value === this.segment())?.emptyText ?? '');
  /** The job a button was just pressed on, so its buttons wait for the answer. */
  readonly acting = signal<string | null>(null);

  readonly orders = resource({
    params: () => ({ segment: this.segment(), version: this.shift.jobsVersion() }),
    loader: ({ params }) => this.ordersService.listOrders(params.segment),
    defaultValue: [],
  });

  /** Never throws: an errored load shows the empty state instead (Rule 8). */
  readonly list = computed(() => (this.orders.hasValue() ? this.orders.value() : []));
  readonly blockMessage = computed(() => onlineBlockMessage(this.shift.block(), this.shift.profile()?.rejectionReason ?? null));

  ngOnInit(): void {
    void this.shift.start();
  }

  onSegmentChange(event: SegmentCustomEvent): void {
    const value = ORDER_PAGE.SEGMENTS.find((tab) => tab.value === event.detail.value)?.value;
    if (value) {
      this.segment.set(value);
    }
  }

  onOnlineChange(event: ToggleCustomEvent): void {
    void (event.detail.checked ? this.shift.goOnline() : this.shift.goOffline());
  }

  isOffer(order: RiderOrder): boolean {
    return order.status === OFFER_STATUS;
  }

  isInProgress(order: RiderOrder): boolean {
    return IN_PROGRESS_STATUSES.includes(order.status);
  }

  async accept(order: RiderOrder): Promise<void> {
    await this.act(order, () => this.ordersService.accept(order.id));
  }

  async reject(order: RiderOrder): Promise<void> {
    await this.act(order, () => this.ordersService.reject(order.id, ORDER_PAGE.REJECT_REASON));
  }

  private async act(order: RiderOrder, action: () => Promise<unknown>): Promise<void> {
    this.acting.set(order.id);
    try {
      await action();
    } catch (error) {
      await this.alerts.presentError(ORDER_PAGE.ALERT_TITLE, error);
    } finally {
      this.acting.set(null);
      this.shift.jobsChanged();
    }
  }
}
