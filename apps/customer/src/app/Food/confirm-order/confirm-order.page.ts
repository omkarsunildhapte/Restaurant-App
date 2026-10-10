import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonList, IonTitle, IonToolbar } from '@ionic/angular';
import { NotConnectedToast } from 'src/app/core/data/not-implemented';
import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { switchMap } from 'rxjs';
import { FoodService } from 'src/app/service/food.service';
import { RoutingService } from 'src/app/service/routing.service';
import { UserService } from 'src/app/service/user.service';
import { LoadingComponent } from '../../loader/loader.component';

@Component({
    selector: 'app-confirm-order',
    templateUrl: './confirm-order.page.html',
    styleUrls: ['./confirm-order.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonList, IonTitle, IonToolbar, LoadingComponent]
})
export class ConfirmOrderPage implements OnInit {
  readonly cartList = signal<any[]>([]);
  deliveryCharge: number = 10;
  voucherCharge: number = 0;
  voucherValue: string = '';
  readonly totalValue = signal<number>(0);
  readonly isLoader = signal<boolean>(true);
  readonly user = signal<any | undefined>(undefined);
  constructor(
    public routing: RoutingService,
    private foodService: FoodService,
    private userService:UserService,
    private notConnected: NotConnectedToast,
  ) {}

  ngOnInit() {
    const uid = localStorage.getItem('uid');
    if (uid) {
      this.isLoader.set(true);
      this.foodService.getCartItems(uid).subscribe((res: any) => {
        this.isLoader.set(false);
        this.cartList.set(res);
        if (this.cartList().length) this.getTotalAmount();
      });
      this.isLoader.set(true);
      this.userService.getuserById(uid).subscribe((res:any)=>{
        this.isLoader.set(false);
        this.user.set(res);
      })
    }
  
  }

  getTotalAmount(): void {
    this.isLoader.set(true);
    setTimeout(() => {
      const itemTotal = this.cartList().reduce((total, item) => {
        const itemTotal = Number(item.price * item.totalNumber);
        const subItemTotal = item.subItem?.reduce((subTotal: any, subItem: any) => subTotal + Number(subItem.price * subItem.totalNumber), 0) || 0;
        return total + itemTotal + subItemTotal;
      }, 0);
      // Signals schedule change detection (zoneless); no manual detectChanges needed.
      this.totalValue.set(itemTotal + this.deliveryCharge + this.voucherCharge);
      this.isLoader.set(false);
    }, 2000);
  }

  getSubValue(product:any){
    if (product.subItem.length){
      return product.subItem?.reduce((subTotal: any, subItem: any) => subTotal + Number(subItem.price * subItem.totalNumber), 0) || 0;
    }
  }
  getOrderBooking() {
    const uid = localStorage.getItem('uid');
    if (uid) {
      this.isLoader.set(true);
      const items = this.cartList().map((e) => ({
        name: e.name,
        image: e.image,
        amount: e.price * e.totalNumber,
        subItems:e.subItem.map((m:any) => ({
          name: m.name,
          image: m.image,
          amount: m.price * e.totalNumber,
        }))
      }));
      const paymentType = 'cash';
      const payload = {
        items: items,
        paymentType: paymentType,
        totalValue: this.totalValue(),
        voucher: this.voucherValue,
        userId: uid,
        status: 'pending',
        createDate: new Date(),
      };

      this.foodService
        .addOrder(payload)
        .pipe(
          switchMap(() => this.foodService.addToUserOrder(uid, payload)),
          switchMap(() => this.foodService.deleteAllFromCart(uid))
        )
        .subscribe(
          () => {
            this.isLoader.set(false);
            this.routing.navigateUrl('/main/track', undefined);
          },
          (error) => {
            this.isLoader.set(false);
            console.error('Error processing order:', error);
            this.notConnected.show();
          }
        );
    }
  }

}
