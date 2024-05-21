import { Component, OnInit } from '@angular/core';
import { RoutingService } from '../service/routing.service';
import { FoodService } from '../service/food.service';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  products:any[] =[];
  bestProduct:any[]=[];
  comboProducts:any[] = [];

  constructor(
    public routerLink :RoutingService,
    public fireBaseService :FoodService
  ){}
  ngOnInit(): void {
    this.fireBaseService.getFood().subscribe((res:any)=>{
      this.products = res.filter((e:any)=>e.type=='single');
      this.comboProducts = res.filter((e:any)=>e.type=='combo')
    })      
  }

  navigateUrl(value:any){
    const selected= {
      id:value.id
    }
    this.routerLink.navigateUrl('/main/food-review',selected);
  }

}

