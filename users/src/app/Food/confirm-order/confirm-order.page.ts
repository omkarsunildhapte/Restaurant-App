import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { FoodService } from 'src/app/service/food.service';
import { RoutingService } from 'src/app/service/routing.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  selector: 'app-confirm-order',
  templateUrl: './confirm-order.page.html',
  styleUrls: ['./confirm-order.page.scss'],
})
export class ConfirmOrderPage implements OnInit {
  cartList: any[] = [];
  deliveryCharge: number = 10;
  voucherCharge: number = 0;
  voucherValue: string = '';
  totalValue: number = 0;
  isLoader: boolean = true;
  user:any;
  constructor(
    public routing: RoutingService,
    private foodService: FoodService,
    private cdr: ChangeDetectorRef,
    private userService:UserService,
  ) {}

  ngOnInit() {
    const uid = localStorage.getItem('uid');
    if (uid) {
      this.isLoader = true;
      this.foodService.getCartItems(uid).subscribe((res: any) => {
        this.isLoader = false;
        this.cartList = res;
        this.getTotalAmount();
      });
      this.isLoader = true;
      this.userService.getuserById(uid).subscribe((res:any)=>{
        this.isLoader =false;
        this.user = res;
        console.log(this.user);
      })
    }
  
  }

  getTotalAmount(): void {
    this.isLoader = true;
    setTimeout(() => {
      const itemTotal = this.cartList.reduce((total, item) => {
        const itemTotal = Number(item.price * item.totalNumber);
        this.cdr.detectChanges();
        const subItemTotal = item.subItem?.reduce((subTotal: any, subItem: any) => subTotal + Number(subItem.price * subItem.totalNumber), 0) || 0;
        this.cdr.detectChanges();
        this.isLoader = false;
        return total + itemTotal + subItemTotal;
      }, 0);
      this.totalValue = itemTotal + this.deliveryCharge + this.voucherCharge;
    }, 2000);
  }

  getSubValue(product:any){
    if (product.subItem.length){
      return product.subItem?.reduce((subTotal: any, subItem: any) => subTotal + Number(subItem.price * subItem.totalNumber), 0) || 0;
    }
  }
  getOrderBooking() {
    this.isLoader = true;
    const uid = localStorage.getItem('uid');
    if (uid) {
      const items = this.cartList.map((e) => ({
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
        totalValue: this.totalValue,
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
            this.isLoader = false;
            this.routing.navigateUrl('/main/track', undefined);
          },
          (error) => {
            console.error('Error processing order:', error);
          }
        );
    }
  }

}
