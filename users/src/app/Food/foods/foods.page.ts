import { Component, OnInit } from '@angular/core';
import { FoodService } from 'src/app/service/food.service';
import { RoutingService } from 'src/app/service/routing.service';

@Component({
  selector: 'app-foods',
  templateUrl: './foods.page.html',
  styleUrls: ['./foods.page.scss'],
})
export class FoodsPage implements OnInit {
 itemList:any[]=[];
  constructor(
    private foodService :FoodService,
    public routerLink : RoutingService

  ) { }

  ngOnInit() {
    this.foodService.getFood().subscribe((res:any)=>{
      this.itemList = res;
    })  
  }
  navigateUrl(value:any){
    const selected= {
      id:value.id
    }
    this.routerLink.navigateUrl('/main/food-review',selected);
  }
}
