import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { RoutingService } from '../servies/routing.service';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  products = [
    { img:'../../assets/icon/sanwtich.svg',name: 'Sandwich' },
    { img:'../../assets/icon/sanwtich.svg',name: 'Burger' },
    { img:'../../assets/icon/sanwtich.svg',name: 'Pizza' },
    { img:'../../assets/icon/sanwtich.svg',name: 'Salad' }
  ];
  bestProduct = [
    { name: 'Extreme cheese whopper JR', price: 5.99, category: 'Burger',img:'../../assets/icon/bannerImges.svg' },
    { name: 'Extreme cheese whopper JR', price: 5.99, category: 'Burger',img:'../../assets/icon/bannerImges.svg' },
    { name: 'Extreme cheese whopper JR', price: 5.99, category: 'Burger',img:'../../assets/icon/bannerImges.svg' },
    { name: 'Extreme cheese whopper JR', price: 5.99, category: 'Burger',img:'../../assets/icon/bannerImges.svg' },
  ];
  comboProducts = [
    { name: 'Combo spicy tender', price: 10.15, category: 'Burger combo' },
    { name: 'Combo spicy tender', price: 10.15, category: 'Burger combo' },
    { name: 'Combo spicy tender', price: 10.15, category: 'Burger combo' },
    { name: 'Combo spicy tender', price: 10.15, category: 'Burger combo' },
  ];

  constructor(
    public routerLink :RoutingService
  ){}

  navigateUrl(value:any){
    this.routerLink.navigateUrl('/main/food-review',undefined);
  }

}

