import { Component, OnInit } from '@angular/core';
import { OrderService } from '../service/order.service';
import { UserService } from '../service/user.service';

@Component({
  selector: 'app-order',
  templateUrl: './order.page.html',
  styleUrls: ['./order.page.scss'],
})
export class OrderPage implements OnInit {
  segment: string = 'delivery';
  orderList: any[]=[];

  constructor(
    private orderService:OrderService,
    private userService:UserService
  ) { }

  ngOnInit() {
    this.orderService.getOrder().subscribe((res:any)=>{
      this.orderList=res
    })
  }

}
