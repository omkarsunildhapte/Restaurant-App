import { IonButton, IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonLabel, IonList, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/angular';
import { NotConnectedToast } from 'src/app/core/data/not-implemented';
import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FoodService } from 'src/app/service/food.service';
import { RoutingService } from 'src/app/service/routing.service';
import { FormsModule } from '@angular/forms';
import { LoadingComponent } from '../../loader/loader.component';

@Component({
    selector: 'app-food-review',
    templateUrl: './food-review.page.html',
    styleUrls: ['./food-review.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonButton, IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonLabel, IonList, IonSegment, IonSegmentButton, IonTitle, IonToolbar, FormsModule, LoadingComponent]
})
export class FoodReviewPage implements OnInit {
  segment: string = 'delivery';
  readonly product = signal<any | undefined>(undefined);
  readonly subProduct = signal<any[]>([]);
  readonly isLoader = signal<boolean>(true);
  constructor(
    public routing: RoutingService,
    private foodService: FoodService,
    private activeRouter: ActivatedRoute,
    private notConnected: NotConnectedToast
  ) { }

  ngOnInit() {
    this.activeRouter.queryParamMap.subscribe((params: any) => {
      this.isLoader.set(true);
      this.foodService.getFood().subscribe((res: any) => {
        this.isLoader.set(false);
        this.subProduct.set(res
          .filter((e: any) => e.type == 'beverage')
          .map((e: any) => ({
            ...e,
            number: 0
          })));
      })
      this.isLoader.set(true);
      this.foodService.getFoodById(params.params.id).subscribe((res: any) => {
        this.isLoader.set(false);
        if (!res) {
          this.product.set(undefined);
          return;
        }
        this.product.set(res);
        this.product().number = 1
        this.product().totolAmount = res.price
      })
    })
  }

  minusProduct() {
    if (!this.product()) return;
    if (this.product().number > 0) {
      this.product().number -= 1;
      this.product().totolAmount = this.product().price * this.product().number;
      this.getTotal()
    }
  }

  plusProduct() {
    if (!this.product()) return;
    if (this.product().number > 0) {
      this.product().number += 1;
      this.product().totolAmount = this.product().price * this.product().number;
      this.getTotal()
    }
  }
  minusSubProduct(index: number) {
    if (this.subProduct()[index].number >= 0) {
      this.subProduct()[index].number -= 1;
      this.subProduct()[index].totalAmount = this.subProduct()[index].price * this.subProduct()[index].number
    }
    this.getSubTotal();
    this.getTotal()
  }

  plusSubProduct(index: number) {
    if (this.subProduct()[index].number >= 0) {
      this.subProduct()[index].number += 1;
      this.subProduct()[index].totalAmount = this.subProduct()[index].price * this.subProduct()[index].number
    }
    this.getSubTotal();
    this.getTotal()
  }
  getSubTotal() {
    return this.subProduct().reduce((total, product) => total + product.totalAmount, 0);
  }

  getTotal() {
    if (!this.product()) return;
    this.product().totolAmount = (this.product().price * this.product().number) + this.getSubTotal()
  }

  getAddtoCart() {
    const uid = localStorage.getItem('uid');
    if (uid) {
      if (!this.product()) {
        this.notConnected.show();
        return;
      }
      this.isLoader.set(true);
      let subItem: any[] = [];
      if (this.subProduct().length > 0) {
        subItem = this.subProduct().filter(e => e.number > 0).map((e: any) => ({
          name: e.itemName,
          price: e.price,
          totalNumber: e.number,
          image: e.logoUrl
        }))
      }
      const item = {
        name: this.product().itemName,
        price: this.product().price,
        totalNumber: this.product().number,
        image: this.product().logoUrl,
        subItem: subItem
      }
      this.foodService.addToCart(uid, item).subscribe({
        next: () => {
          this.isLoader.set(false);
          this.routing.navigateUrl('/main/add-cart', undefined)
        },
        error: () => {
          this.isLoader.set(false);
          this.notConnected.show();
        }
      });
    }
  }

  viewCart() {
    this.routing.navigateUrl('/main/add-cart', undefined)
  }

}
