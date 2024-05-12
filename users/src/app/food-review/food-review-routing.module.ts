import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FoodReviewPage } from './food-review.page';

const routes: Routes = [
  {
    path: '',
    component: FoodReviewPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FoodReviewPageRoutingModule {}
