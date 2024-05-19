import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { RoutingService } from '../../servies/routing.service';
import { FirebaseService } from 'src/app/servies/firebase.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-food-review',
  templateUrl: './food-review.page.html',
  styleUrls: ['./food-review.page.scss'],
})
export class FoodReviewPage implements OnInit {
 segment: string='delivery';
 product: any;
constructor(
  public routing:RoutingService,
  private fireBaseService :FirebaseService,
  private activeRouter:ActivatedRoute
){}

  ngOnInit() {
    this.activeRouter.queryParamMap.subscribe((params:any)=>{
      this.fireBaseService.getFoodById(params.params.id).subscribe((res:any)=>{
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
        const item = {
          name : this.product.itemName,
          price: this.product.price,
          totalNumber:this.product.number,
          img : this.product.logoUrl
        }
        this.fireBaseService.addToCart(uid, item).then(() => {
          this.routing.navigateUrl('/main/add-cart',undefined)
        });
      }
  }

  viewCart(){
    this.routing.navigateUrl('/main/confirm-order',undefined)
  }

}
