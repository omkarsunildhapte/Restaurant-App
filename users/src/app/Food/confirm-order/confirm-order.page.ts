import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs';
import { FoodService } from 'src/app/service/food.service';
import { RoutingService } from 'src/app/service/routing.service';

@Component({
  selector: 'app-confirm-order',
  templateUrl: './confirm-order.page.html',
  styleUrls: ['./confirm-order.page.scss'],
})
export class ConfirmOrderPage implements OnInit {
  cartList: any[] = [];
  subItem: any[] = [];
  subitemTotal: number = 0;
  deliveryCharge: number = 0;
  voucherValue: string = '';
  totalValue: number = 0;
  constructor(
    public routing: RoutingService,
    private foodService: FoodService
  ) { }
  ngOnInit() {
    const uid = localStorage.getItem('uid');
    if (uid) {
      this.foodService.getCartItems(uid).subscribe((res: any) => {
        this.cartList = res
      })
    }
  }

  getPrice(price: number, noOfItems: number, index: number): number {
    this.cartList[index].totalAmount = price * noOfItems;
    return this.cartList[index].totalAmount;
  }
  
  getOrderBooking() {
    const uid = localStorage.getItem('uid');
    if (uid) {
      const items = this.cartList.map(e => ({
        name: e.name,
        image: e.image,
        amount: e.totalAmount
      }));

      const subItems = this.subItem.map(e => ({
        name: e.name,
        image: e.image,
        amount: e.totalAmount
      }));

      const totalItems = [...items, ...subItems];
      const paymentType = "cash";

      const payload = {
        items: totalItems,
        paymentType: paymentType,
        totalValue: this.totalValue,
        voucher: this.voucherValue,
        userId: uid,
        status: 'pending',
        createDate: new Date()
      };

      this.foodService.addOrder(payload).pipe(
        switchMap(() => this.foodService.addToUserOrder(uid, payload)),
        switchMap(() => this.foodService.deleteAllFromCart(uid))
      ).subscribe(
        () => {
          this.routing.navigateUrl('/main/track', undefined)
        },
        (error) => {
          console.error('Error processing order:', error);
        }
      );
    }
  }
}
