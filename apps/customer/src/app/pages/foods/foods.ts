import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonImg } from '@ionic/angular/ion-img';
import { IonItem } from '@ionic/angular/ion-item';
import { IonList } from '@ionic/angular/ion-list';
import { IonSearchbar } from '@ionic/angular/ion-searchbar';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { FoodItem } from '@appTypes/food.types';
import { CURRENCY } from '@constants/app.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { FoodService } from '@services/food/food.service';
import { Loading } from '@shared/loading/loading';

/** Food tab: the full menu list. */
@Component({
  selector: 'app-foods',
  imports: [RouterLink, IonBackButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonList, IonSearchbar, IonToolbar, Loading],
  templateUrl: './foods.html',
  styleUrl: './foods.css',
})
export class Foods {
  private readonly foodService = inject(FoodService);

  readonly currency = CURRENCY.SYMBOL;
  readonly links = APP_ROUTE_LINKS;

  readonly foods = resource<FoodItem[], unknown>({ loader: () => this.foodService.listFoods(), defaultValue: [] });
}
