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
 segment: string='delivery';
 product: any;
  subProduct: any;
constructor(
  public routing:RoutingService,
  private foodService :FoodService,
  private activeRouter:ActivatedRoute
){}

  ngOnInit() {
    this.activeRouter.queryParamMap.subscribe((params:any)=>{
      this.foodService.getFoodById(params.params.id).subscribe((res:any)=>{
        this.product = res;
        this.product.number=1
        debugger
        this.product.totolAmount = res.price
      }) 
    })
  }
  
  minusProduct(){
    if (this.product.number>0){
      this.product.number -=1;
      this.product.totolAmount = this.product.price * this.product.number
    }
  }

  plusProduct(){
    if (this.product.number>0){
      this.product.number +=1;
      this.product.totolAmount = this.product.price * this.product.number
    }
  }
  
  getAddtoCart(){
    const uid = localStorage.getItem('uid'); 
      if (uid) {
        const subitem = {
          name : this.subProduct.itemName,
          price: this.subProduct.price,
          totalNumber:this.subProduct.number,
          img : this.subProduct.logoUrl
        }
        const item = {
          name : this.product.itemName,
          price: this.product.price,
          totalNumber:this.product.number,
          img : this.product.logoUrl,
          subItem : subitem
        }
      
        this.foodService.addToCart(uid, item).then(() => {
          this.routing.navigateUrl('/main/add-cart',undefined)
        });
      }
  }

  viewCart(){
    this.routing.navigateUrl('/main/add-cart',undefined)
  }

}
