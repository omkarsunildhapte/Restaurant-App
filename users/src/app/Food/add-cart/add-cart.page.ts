import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FoodService } from 'src/app/service/food.service';
import { RoutingService } from 'src/app/service/routing.service';

@Component({
  selector: 'app-add-cart',
  templateUrl: './add-cart.page.html',
  styleUrls: ['./add-cart.page.scss'],
})
export class AddCartPage implements OnInit {
  cartList: any[] = [];
  isLoader: boolean = true;
  uid: string | null = '';
  totalAmount: number = 0;
  constructor(
    public routing: RoutingService,
    private foodService: FoodService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.isLoader = true;
    this.uid = localStorage.getItem('uid');
    if (this.uid) {
      this.foodService.getCartItems(this.uid).subscribe((res: any) => {
        this.isLoader = false;
        this.cartList = res;
        this.getTotalAmount()
      })
    }
  }

  getMinus(index: number) {
    if (this.cartList[index].totalNumber > 0) {
      this.cartList[index].totalNumber = this.cartList[index].totalNumber - 1;
    }
    this.getTotalAmount();
  }

  getPlus(index: number) {
    if (this.cartList[index].totalNumber >= 0) {
      this.cartList[index].totalNumber = this.cartList[index].totalNumber + 1;
    }
    this.getTotalAmount();
  }

  getSubMinus(mainIndex: number, subIndex: number) {
    if (this.cartList[mainIndex].subItem[subIndex].totalNumber > 0) {
      this.cartList[mainIndex].subItem[subIndex].totalNumber = this.cartList[mainIndex].subItem[subIndex].totalNumber - 1;
    }
    this.getTotalAmount();
  }

  getSubPlus(mainIndex: number, subIndex: number) {
    if (this.cartList[mainIndex].subItem[subIndex].totalNumber >= 0) {
      this.cartList[mainIndex].subItem[subIndex].totalNumber = this.cartList[mainIndex].subItem[subIndex].totalNumber + 1;
    }
    this.getTotalAmount();
  }

  getTotalAmount(): void {
    this.isLoader = true;
    setTimeout(() => {
      this.totalAmount = this.cartList.reduce((total, item) => {
        const itemTotal = Number(item.price * item.totalNumber);
        this.cdr.detectChanges();
        const subItemTotal = item.subItem?.reduce((subTotal: any, subItem: any) => subTotal + Number(subItem.price * subItem.totalNumber), 0) || 0;
        this.cdr.detectChanges();
        this.isLoader = false;
        return total + itemTotal + subItemTotal;
      }, 0);
    }, 2000);
  }

  updateAllInCart() {
    this.isLoader = true;
    if (this.uid) {
      this.foodService.updateCartItemsByIds(this.uid, this.cartList).subscribe((res: any) => {
        this.isLoader = false;
        this.routing.navigateUrl('/main/confirm-order', undefined)
      })
    }
  }
}
