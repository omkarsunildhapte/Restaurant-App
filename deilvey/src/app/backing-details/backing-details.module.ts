import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BackingDetailsPageRoutingModule } from './backing-details-routing.module';

import { BackingDetailsPage } from './backing-details.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BackingDetailsPageRoutingModule
  ],
  declarations: [BackingDetailsPage]
})
export class BackingDetailsPageModule {}
