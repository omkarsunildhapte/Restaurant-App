import { Component, OnInit } from '@angular/core';
import { FoodService } from 'src/app/service/food.service';
import { RoutingService } from 'src/app/service/routing.service';

@Component({
  selector: 'app-add-cart',
  templateUrl: './add-cart.page.html',
  styleUrls: ['./add-cart.page.scss'],
})
export class AddCartPage implements OnInit {
  cartList: any[]=[];
  constructor(
    public routing:RoutingService,
    private foodService:FoodService
  ){}
  
  ngOnInit() {
    const uid = localStorage.getItem('uid');
    if (uid){
      this.foodService.getCartItems(uid).subscribe((res:any)=>{
        this.cartList = res
      })
    }
  }
  
  getPrice(price: number, noOfItems: number, index: number): number {
    this.cartList[index].totalAmount = price * noOfItems;
    return this.cartList[index].totalAmount;
  }
  
  getTotalAmount(): number {
    return this.cartList.reduce((total, item) => total + item.totalAmount, 0);
  }
  
  getMinus(index:number){
    if(this.cartList[index].totalNumber>0){
      this.cartList[index].totalNumber -=this.cartList[index].totalNumber
    }
  }

  getPlus(index:number){
    if(this.cartList[index].totalNumber>0){
      this.cartList[index].totalNumber +=this.cartList[index].totalNumber
    }
  }

}
