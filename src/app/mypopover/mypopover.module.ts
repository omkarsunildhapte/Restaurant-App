import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MypopoverPageRoutingModule } from './mypopover-routing.module';

import { MypopoverPage } from './mypopover.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MypopoverPageRoutingModule
  ],
  declarations: [MypopoverPage]
})
export class MypopoverPageModule {}
