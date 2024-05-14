import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-foods',
  templateUrl: './foods.page.html',
  styleUrls: ['./foods.page.scss'],
})
export class FoodsPage implements OnInit {
  comboProducts = [
    { name: 'Combo spicy tender', price: 10.15, category: 'Burger combo' },
    { name: 'Combo spicy tender', price: 10.15, category: 'Burger combo' },
    { name: 'Combo spicy tender', price: 10.15, category: 'Burger combo' },
    { name: 'Combo spicy tender', price: 10.15, category: 'Burger combo' },
  ];
  constructor() { }

  ngOnInit() {
  }

}
