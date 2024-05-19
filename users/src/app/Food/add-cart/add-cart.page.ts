import { Component, OnInit } from '@angular/core';
import { RoutingService } from '../../servies/routing.service';
import { FirebaseService } from 'src/app/servies/firebase.service';

@Component({
  selector: 'app-add-cart',
  templateUrl: './add-cart.page.html',
  styleUrls: ['./add-cart.page.scss'],
})
export class AddCartPage implements OnInit {
  cartList: any[]=[];

  constructor(
    public routing:RoutingService,
    private firebaerService:FirebaseService
  ){}
  
  ngOnInit() {
    const uid = localStorage.getItem('uid');
    if (uid){
      this.firebaerService.getCartItems(uid).subscribe((res:any)=>{
        this.cartList = res
      })
    }
  }
  
  getPrice(price:number,NoofItem:number,index:number):number {
   return this.cartList[index].totolAmount = price * NoofItem;
  }
  getTotalAmount(): number {
    return this.cartList.reduce((total, item) => {
      return (total + item.totalAmount)}, 0);
  }


}
