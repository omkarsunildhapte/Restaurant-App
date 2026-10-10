import { Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';
import { ReviewCard as Review } from '@appTypes/ui.types';

/** One customer review (author, star, date, text, likes). */
@Component({
  selector: 'app-review-card',
  imports: [IonIcon],
  templateUrl: './review-card.html',
  styleUrl: './review-card.css',
})
export class ReviewCard {
  readonly review = input.required<Review>();
}
