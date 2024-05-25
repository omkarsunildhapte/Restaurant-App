import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
  declarations: [TableDetailsPage],
  providers:[DatePipe]
})
export class TableDetailsPageModule {}
