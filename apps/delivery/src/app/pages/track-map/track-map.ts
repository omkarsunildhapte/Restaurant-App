import { Component, computed, inject, resource, signal } from '@angular/core';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButton } from '@ionic/angular/ion-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { TrackingService } from '@services/tracking/tracking.service';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';

/**
 * Follows the rider's open delivery. RenderMode.Client: the map display (Phase 5) needs a real
 * DOM. The delivery read is a stub, so the card shows the empty state.
 */
@Component({
  selector: 'app-track-map',
  imports: [IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar],
  templateUrl: './track-map.html',
  styleUrl: './track-map.css',
})
export class TrackMap {
  private readonly tracking = inject(TrackingService);

  readonly backLink = APP_ROUTE_LINKS.ORDER;
  readonly showDetails = signal(true);

  readonly delivery = resource({
    loader: () => this.tracking.getActiveDelivery(),
    defaultValue: null,
  });

  /** Never throws: an errored load shows the empty state (Rule 8). */
  readonly current = computed(() => (this.delivery.hasValue() ? this.delivery.value() : null));
  readonly initial = computed(() => this.current()?.customerName?.charAt(0).toUpperCase() ?? '');

  toggleDetails(): void {
    this.showDetails.update((shown) => !shown);
  }
}
