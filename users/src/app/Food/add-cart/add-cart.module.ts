import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddCartPageRoutingModule } from './add-cart-routing.module';

import { AddCartPage } from './add-cart.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddCartPageRoutingModule
  ],
  declarations: [AddCartPage]
})
export class AddCartPageModule {}
