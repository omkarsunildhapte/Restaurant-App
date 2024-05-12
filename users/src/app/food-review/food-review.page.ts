import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-food-review',
  templateUrl: './food-review.page.html',
  styleUrls: ['./food-review.page.scss'],
})
export class FoodReviewPage implements OnInit {
segment: string='delivery';

  constructor() { }

  ngOnInit() {
  }

}
