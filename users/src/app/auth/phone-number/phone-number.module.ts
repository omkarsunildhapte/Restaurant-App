import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PhoneNumberPageRoutingModule } from './phone-number-routing.module';

import { PhoneNumberPage } from './phone-number.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    PhoneNumberPageRoutingModule
  ],
  declarations: [PhoneNumberPage]
})
export class PhoneNumberPageModule {}
