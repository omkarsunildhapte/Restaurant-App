import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FoodService } from 'src/app/service/food.service';
import { RoutingService } from 'src/app/service/routing.service';

@Component({
  selector: 'app-food-review',
  templateUrl: './food-review.page.html',
  styleUrls: ['./food-review.page.scss'],
})
export class FoodReviewPage implements OnInit {
  segment: string = 'delivery';
  product: any;
  subProduct: any[] = [];
  isLoader: boolean = true;
  constructor(
    public routing: RoutingService,
    private foodService: FoodService,
    private activeRouter: ActivatedRoute
  ) { }

  ngOnInit() {
    this.activeRouter.queryParamMap.subscribe((params: any) => {
      this.isLoader = true;
      this.foodService.getFood().subscribe((res: any) => {
        this.isLoader = false;
        this.subProduct = res.filter((e: any) => e.type == 'beverage')
        this.subProduct = this.subProduct.map((e: any) => ({
          ...e,
          number: 0
        }))
      })
      this.isLoader = true;
      this.foodService.getFoodById(params.params.id).subscribe((res: any) => {
        this.isLoader = false;
        this.product = res;
        this.product.number = 1
        this.product.totolAmount = res.price
      })
    })
  }

  minusProduct() {
    if (this.product.number > 0) {
      this.product.number -= 1;
      this.product.totolAmount = this.product.price * this.product.number;
      this.getTotal()
    }
  }

  plusProduct() {
    if (this.product.number > 0) {
      this.product.number += 1;
      this.product.totolAmount = this.product.price * this.product.number;
      this.getTotal()
    }
  }
  minusSubProduct(index: number) {
    if (this.subProduct[index].number >= 0) {
      this.subProduct[index].number -= 1;
      this.subProduct[index].totalAmount = this.subProduct[index].price * this.subProduct[index].number
    }
    this.getSubTotal();
    this.getTotal()
  }

  plusSubProduct(index: number) {
    if (this.subProduct[index].number >= 0) {
      this.subProduct[index].number += 1;
      this.subProduct[index].totalAmount = this.subProduct[index].price * this.subProduct[index].number
    }
    this.getSubTotal();
    this.getTotal()
  }
  getSubTotal() {
    return this.subProduct.reduce((total, product) => total + product.totalAmount, 0);
  }

  getTotal() {
    this.product.totolAmount = (this.product.price * this.product.number) + this.getSubTotal()
  }

  getAddtoCart() {
    const uid = localStorage.getItem('uid');
    if (uid) {
      this.isLoader =true;
      let subItem: any[] = [];
      if (this.subProduct.length > 0) {
        subItem = this.subProduct.filter(e => e.number > 0).map((e: any) => ({
          name: e.itemName,
          price: e.price,
          totalNumber: e.number,
          image: e.logoUrl
        }))
      }
      const item = {
        name: this.product.itemName,
        price: this.product.price,
        totalNumber: this.product.number,
        image: this.product.logoUrl,
        subItem: subItem
      }
      this.foodService.addToCart(uid, item).then(() => {
      this.isLoader =false;
        this.routing.navigateUrl('/main/add-cart', undefined)
      });
    }
  }

  viewCart() {
    this.routing.navigateUrl('/main/add-cart', undefined)
  }

}
