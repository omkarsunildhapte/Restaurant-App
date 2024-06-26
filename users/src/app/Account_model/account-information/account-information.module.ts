import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AccountInformationPageRoutingModule } from './account-information-routing.module';

import { AccountInformationPage } from './account-information.page';
import { LoaderModule } from 'src/app/loader/loader.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AccountInformationPageRoutingModule,
    ReactiveFormsModule,
    LoaderModule
  ],
  declarations: [AccountInformationPage]
})
export class AccountInformationPageModule {}
