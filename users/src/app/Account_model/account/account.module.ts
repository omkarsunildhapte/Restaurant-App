import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AccountPageRoutingModule } from './account-routing.module';

import { AccountPage } from './account.page';
import { TabsPageModule } from '../../tabs/tabs.module';
import { LoaderModule } from 'src/app/loader/loader.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AccountPageRoutingModule,
    LoaderModule
  ],
  declarations: [AccountPage]
})
export class AccountPageModule {}
