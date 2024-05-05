import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TableDetailsPageRoutingModule } from './table-details-routing.module';

import { TableDetailsPage } from './table-details.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TableDetailsPageRoutingModule
  ],
  declarations: [TableDetailsPage]
})
export class TableDetailsPageModule {}
