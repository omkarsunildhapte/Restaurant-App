import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { RoutingService } from '../servies/routing.service';

@Component({
  selector: 'app-food-review',
  templateUrl: './food-review.page.html',
  styleUrls: ['./food-review.page.scss'],
})
export class FoodReviewPage implements OnInit {
 segment: string='delivery';
constructor(
  public routing:RoutingService
){}

  ngOnInit() {
  }
}
