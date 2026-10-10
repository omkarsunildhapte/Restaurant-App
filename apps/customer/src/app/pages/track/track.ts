import { Component, computed, inject, resource, signal } from '@angular/core';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButton } from '@ionic/angular/ion-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonImg } from '@ionic/angular/ion-img';
import { IonItem } from '@ionic/angular/ion-item';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { FoodOrder } from '@appTypes/food.types';
import { CURRENCY } from '@constants/app.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { TRACK_PAGE } from '@constants/track.constants';
import { AuthService } from '@services/auth/auth.service';
import { FoodService } from '@services/food/food.service';
import { Loading } from '@shared/loading/loading';

/** The customer's latest order and its delivery details. */
@Component({
  selector: 'app-track',
  imports: [IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonTitle, IonToolbar, Loading],
  templateUrl: './track.html',
  styleUrl: './track.css',
})
export class Track {
  private readonly foodService = inject(FoodService);
  private readonly auth = inject(AuthService);

  readonly copy = TRACK_PAGE;
  readonly currency = CURRENCY.SYMBOL;
  readonly links = APP_ROUTE_LINKS;
  readonly courierTel = `tel:${TRACK_PAGE.COURIER_PHONE}`;

  /** Details panel vs. map view (the map itself is not implemented yet). */
  readonly showDetails = signal(true);
  readonly expanded = signal(false);

  readonly orders = resource<FoodOrder[], string | undefined>({
    params: () => this.auth.currentUser()?.id,
    loader: ({ params }) => this.foodService.listOrders(params),
    defaultValue: [],
  });
  readonly order = computed<FoodOrder | null>(() => this.orders.value()[0] ?? null);
}
