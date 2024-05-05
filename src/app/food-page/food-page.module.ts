import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FoodPagePageRoutingModule } from './food-page-routing.module';

import { FoodPagePage } from './food-page.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FoodPagePageRoutingModule
  ],
  declarations: [FoodPagePage]
})
export class FoodPagePageModule {}
