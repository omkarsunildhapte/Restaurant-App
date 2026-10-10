import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonList, IonTitle, IonToolbar } from '@ionic/angular';
import { NotConnectedToast } from 'src/app/core/data/not-implemented';
import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FoodService } from 'src/app/service/food.service';
import { RoutingService } from 'src/app/service/routing.service';
import { LoadingComponent } from '../../loader/loader.component';

@Component({
    selector: 'app-add-cart',
    templateUrl: './add-cart.page.html',
    styleUrls: ['./add-cart.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonList, IonTitle, IonToolbar, LoadingComponent]
})
export class AddCartPage implements OnInit {
  readonly cartList = signal<any[]>([]);
  readonly isLoader = signal<boolean>(true);
  uid: string | null = '';
  readonly totalAmount = signal<number>(0);
  constructor(
    public routing: RoutingService,
    private foodService: FoodService,
    private notConnected: NotConnectedToast
  ) { }

  ngOnInit() {
    this.isLoader.set(true);
    this.uid = localStorage.getItem('uid');
    if (!this.uid) {
      this.isLoader.set(false);
    }
    if (this.uid) {
      this.foodService.getCartItems(this.uid).subscribe((res: any) => {
        this.isLoader.set(false);
        this.cartList.set(res);
        if (this.cartList().length) this.getTotalAmount()
      })
    }
  }

  getMinus(index: number) {
    if (this.cartList()[index].totalNumber > 0) {
      this.cartList()[index].totalNumber = this.cartList()[index].totalNumber - 1;
    }
    this.getTotalAmount();
  }

  getPlus(index: number) {
    if (this.cartList()[index].totalNumber >= 0) {
      this.cartList()[index].totalNumber = this.cartList()[index].totalNumber + 1;
    }
    this.getTotalAmount();
  }

  getSubMinus(mainIndex: number, subIndex: number) {
    if (this.cartList()[mainIndex].subItem[subIndex].totalNumber > 0) {
      this.cartList()[mainIndex].subItem[subIndex].totalNumber = this.cartList()[mainIndex].subItem[subIndex].totalNumber - 1;
    }
    this.getTotalAmount();
  }

  getSubPlus(mainIndex: number, subIndex: number) {
    if (this.cartList()[mainIndex].subItem[subIndex].totalNumber >= 0) {
      this.cartList()[mainIndex].subItem[subIndex].totalNumber = this.cartList()[mainIndex].subItem[subIndex].totalNumber + 1;
    }
    this.getTotalAmount();
  }

  getTotalAmount(): void {
    this.isLoader.set(true);
    setTimeout(() => {
      // Signals schedule change detection (zoneless); no manual detectChanges needed.
      this.totalAmount.set(this.cartList().reduce((total, item) => {
        const itemTotal = Number(item.price * item.totalNumber);
        const subItemTotal = item.subItem?.reduce((subTotal: any, subItem: any) => subTotal + Number(subItem.price * subItem.totalNumber), 0) || 0;
        return total + itemTotal + subItemTotal;
      }, 0));
      this.isLoader.set(false);
    }, 2000);
  }

  updateAllInCart() {
    if (this.uid) {
      this.isLoader.set(true);
      this.foodService.updateCartItemsByIds(this.uid, this.cartList()).subscribe((res: any) => {
        this.isLoader.set(false);
        this.routing.navigateUrl('/main/confirm-order', undefined)
      }, () => {
        this.isLoader.set(false);
        this.notConnected.show();
      })
    }
  }
}
