import { Component, OnInit } from '@angular/core';
import { RoutingService } from '../servies/routing.service';

@Component({
  selector: 'app-add-cart',
  templateUrl: './add-cart.page.html',
  styleUrls: ['./add-cart.page.scss'],
})
export class AddCartPage implements OnInit {

  constructor(
    public routing:RoutingService
  ){}
  
  ngOnInit() {
  }

}
