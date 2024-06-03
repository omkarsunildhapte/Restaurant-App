import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FoodsPageRoutingModule } from './foods-routing.module';

import { FoodsPage } from './foods.page';
import { LoaderModule } from 'src/app/loader/loader.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FoodsPageRoutingModule,
    LoaderModule
  ],
  declarations: [FoodsPage]
})
export class FoodsPageModule {}
