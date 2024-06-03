import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddCartPageRoutingModule } from './add-cart-routing.module';

import { AddCartPage } from './add-cart.page';
import { LoaderModule } from 'src/app/loader/loader.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddCartPageRoutingModule,
    LoaderModule
  ],
  declarations: [AddCartPage]
})
export class AddCartPageModule {}
