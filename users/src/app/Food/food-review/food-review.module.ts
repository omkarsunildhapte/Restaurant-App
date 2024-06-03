import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FoodReviewPageRoutingModule } from './food-review-routing.module';

import { FoodReviewPage } from './food-review.page';
import { LoaderModule } from 'src/app/loader/loader.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FoodReviewPageRoutingModule,
    LoaderModule
  ],
  declarations: [FoodReviewPage]
})
export class FoodReviewPageModule {}
