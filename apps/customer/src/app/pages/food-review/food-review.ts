import { Component, computed, inject, input, linkedSignal, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
import { IonLabel } from '@ionic/angular/ion-label';
import { IonList } from '@ionic/angular/ion-list';
import { IonSegment } from '@ionic/angular/ion-segment';
import { IonSegmentButton } from '@ionic/angular/ion-segment-button';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { FoodItem, NewCartItem } from '@appTypes/food.types';
import { CURRENCY } from '@constants/app.constants';
import { FOOD_REVIEW_PAGE, FoodReviewSegment } from '@constants/food-review.constants';
import { REVIEW_PLACEHOLDERS } from '@constants/reviews.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { AuthService } from '@services/auth/auth.service';
import { FoodService } from '@services/food/food.service';
import { ToastService } from '@services/toast/toast.service';
import { QuantityStepper } from '@components/quantity-stepper/quantity-stepper';
import { ReviewCard } from '@components/review-card/review-card';
import { Loading } from '@shared/loading/loading';

/** One menu item (`?id=`) with add-on beverages, quantity and add-to-cart. */
@Component({
  selector: 'app-food-review',
  imports: [RouterLink, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonLabel, IonList, IonSegment, IonSegmentButton, IonTitle, IonToolbar, QuantityStepper, ReviewCard, Loading],
  templateUrl: './food-review.html',
  styleUrl: './food-review.css',
})
export class FoodReview {
  private readonly foodService = inject(FoodService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** From the `id` query parameter (withComponentInputBinding). */
  readonly id = input<string>('');

  readonly copy = FOOD_REVIEW_PAGE;
  readonly reviews = REVIEW_PLACEHOLDERS;
  readonly currency = CURRENCY.SYMBOL;
  readonly links = APP_ROUTE_LINKS;

  readonly segment = signal<FoodReviewSegment>(FOOD_REVIEW_PAGE.DEFAULT_SEGMENT);

  readonly product = resource<FoodItem | null, string | undefined>({
    params: () => this.id() || undefined,
    loader: ({ params }) => this.foodService.getFood(params),
    defaultValue: null,
  });
  private readonly menu = resource<FoodItem[], unknown>({ loader: () => this.foodService.listFoods(), defaultValue: [] });
  readonly beverages = computed(() => this.menu.value().filter((f) => f.type === 'beverage'));

  readonly quantity = linkedSignal(() => (this.product.value() ? FOOD_REVIEW_PAGE.START_QUANTITY : 0));
  /** Add-on counts, reset whenever the beverage list changes. */
  readonly addOnCounts = linkedSignal(() => this.beverages().map(() => 0));

  readonly total = computed(() => {
    const product = this.product.value();
    const main = product ? product.price * this.quantity() : 0;
    return main + this.beverages().reduce((sum, b, i) => sum + b.price * (this.addOnCounts()[i] ?? 0), 0);
  });

  changeQuantity(delta: number): void {
    this.quantity.update((q) => Math.max(0, q + delta));
  }

  changeAddOn(index: number, delta: number): void {
    this.addOnCounts.update((counts) => counts.map((c, i) => (i === index ? Math.max(0, c + delta) : c)));
  }

  onSegmentChange(event: Event): void {
    const value = (event as CustomEvent<{ value?: string | number }>).detail.value;
    if (value === 'delivery' || value === 'review') this.segment.set(value);
  }

  async addToCart(): Promise<void> {
    const product = this.product.value();
    const userId = this.auth.currentUser()?.id;
    if (!product || !userId) {
      void this.toast.notConnected();
      return;
    }
    const item: NewCartItem = {
      name: product.itemName,
      price: product.price,
      totalNumber: this.quantity(),
      image: product.logoUrl,
      subItem: this.beverages()
        .map((b, i) => ({ name: b.itemName, price: b.price, totalNumber: this.addOnCounts()[i] ?? 0, image: b.logoUrl }))
        .filter((s) => s.totalNumber > 0),
    };
    try {
      await this.foodService.addToCart(userId, item);
      await this.router.navigateByUrl(APP_ROUTE_LINKS.CART);
    } catch {
      void this.toast.notConnected();
    }
  }
}
