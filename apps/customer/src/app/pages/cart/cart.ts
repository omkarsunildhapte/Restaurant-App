import { Component, computed, inject, linkedSignal, resource } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButton } from '@ionic/angular/ion-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonImg } from '@ionic/angular/ion-img';
import { IonItem } from '@ionic/angular/ion-item';
import { IonList } from '@ionic/angular/ion-list';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { CartItem } from '@appTypes/food.types';
import { CURRENCY } from '@constants/app.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { AuthService } from '@services/auth/auth.service';
import { FoodService } from '@services/food/food.service';
import { ToastService } from '@services/toast/toast.service';
import { QuantityStepper } from '@components/quantity-stepper/quantity-stepper';
import { Loading } from '@shared/loading/loading';
import { cartTotal, changeQuantity, mainItemTotal, subItemTotal } from '@utils/cart/cart.util';

/** The cart: edit quantities, then confirm. */
@Component({
  selector: 'app-cart',
  imports: [RouterLink, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonImg, IonItem, IonList, IonTitle, IonToolbar, QuantityStepper, Loading],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  private readonly foodService = inject(FoodService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly currency = CURRENCY.SYMBOL;
  readonly links = APP_ROUTE_LINKS;
  readonly lineTotal = mainItemTotal;
  readonly addOnTotal = subItemTotal;

  readonly cart = resource<CartItem[], string | undefined>({
    params: () => this.auth.currentUser()?.id,
    loader: ({ params }) => this.foodService.listCart(params),
    defaultValue: [],
  });
  /** Local, editable copy of the cart; resets when the cart reloads. */
  readonly lines = linkedSignal(() => this.cart.value());
  readonly total = computed(() => cartTotal(this.lines()));

  change(index: number, delta: number, subIndex?: number): void {
    this.lines.update((items) => changeQuantity(items, index, delta, subIndex));
  }

  async confirm(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    try {
      await this.foodService.updateCart(userId, this.lines());
      await this.router.navigateByUrl(APP_ROUTE_LINKS.CONFIRM_ORDER);
    } catch {
      void this.toast.notConnected();
    }
  }
}
