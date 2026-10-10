import { Component, computed, inject, resource } from '@angular/core';
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
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonImg } from '@ionic/angular/ion-img';
import { IonItem } from '@ionic/angular/ion-item';
import { IonList } from '@ionic/angular/ion-list';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { CartItem, FoodOrder } from '@appTypes/food.types';
import { CURRENCY } from '@constants/app.constants';
import { CONFIRM_ORDER_PAGE } from '@constants/confirm-order.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { AuthService } from '@services/auth/auth.service';
import { FoodService } from '@services/food/food.service';
import { ToastService } from '@services/toast/toast.service';
import { UserService } from '@services/user/user.service';
import { Loading } from '@shared/loading/loading';
import { cartTotal, mainItemTotal, subItemsTotal, toOrderLines } from '@utils/cart/cart.util';

/** Order summary, delivery address and payment choice; places the order. */
@Component({
  selector: 'app-confirm-order',
  imports: [RouterLink, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonList, IonTitle, IonToolbar, Loading],
  templateUrl: './confirm-order.html',
  styleUrl: './confirm-order.css',
})
export class ConfirmOrder {
  private readonly foodService = inject(FoodService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly copy = CONFIRM_ORDER_PAGE;
  readonly currency = CURRENCY.SYMBOL;
  readonly links = APP_ROUTE_LINKS;
  readonly profile = inject(UserService).profile;
  readonly lineTotal = mainItemTotal;
  readonly addOnsTotal = subItemsTotal;

  readonly cart = resource<CartItem[], string | undefined>({
    params: () => this.auth.currentUser()?.id,
    loader: ({ params }) => this.foodService.listCart(params),
    defaultValue: [],
  });
  readonly total = computed(() => cartTotal(this.cart.value()) + CONFIRM_ORDER_PAGE.DELIVERY_CHARGE + CONFIRM_ORDER_PAGE.VOUCHER_CHARGE);

  async placeOrder(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    const order: FoodOrder = {
      items: toOrderLines(this.cart.value()),
      paymentType: CONFIRM_ORDER_PAGE.PAYMENT_TYPE,
      totalValue: this.total(),
      voucher: '',
      userId,
      status: 'pending',
      createDate: new Date().toISOString(),
    };
    try {
      await this.foodService.placeOrder(order);
      await this.foodService.clearCart(userId);
      await this.router.navigateByUrl(APP_ROUTE_LINKS.TRACK);
    } catch {
      void this.toast.notConnected();
    }
  }
}
