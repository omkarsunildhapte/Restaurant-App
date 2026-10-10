import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonImg } from '@ionic/angular/ion-img';
import { IonItem } from '@ionic/angular/ion-item';
import { IonList } from '@ionic/angular/ion-list';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { FoodItem } from '@appTypes/food.types';
import { APP, CURRENCY } from '@constants/app.constants';
import { HOME_PAGE } from '@constants/home.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { FoodService } from '@services/food/food.service';
import { Loading } from '@shared/loading/loading';

/** Landing tab: menu highlights grouped into singles and combos. */
@Component({
  selector: 'app-home',
  imports: [RouterLink, IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonList, IonToolbar, Loading],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly foodService = inject(FoodService);

  readonly app = APP;
  readonly copy = HOME_PAGE;
  readonly currency = CURRENCY.SYMBOL;
  readonly foodLink = APP_ROUTE_LINKS.FOOD_REVIEW;

  readonly foods = resource<FoodItem[], unknown>({ loader: () => this.foodService.listFoods(), defaultValue: [] });
  readonly singles = computed(() => this.foods.value().filter((f) => f.type === 'single'));
  readonly combos = computed(() => this.foods.value().filter((f) => f.type === 'combo'));
}
