import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ForgetPageRoutingModule } from './forget-routing.module';

import { ForgetPage } from './forget.page';
import { LoaderModule } from 'src/app/loader/loader.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    ForgetPageRoutingModule,
    LoaderModule
  ],
  declarations: [ForgetPage]
})
export class ForgetPageModule {}
