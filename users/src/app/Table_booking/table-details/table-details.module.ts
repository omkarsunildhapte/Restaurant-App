import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TableDetailsPageRoutingModule } from './table-details-routing.module';
import { LoaderModule } from 'src/app/loader/loader.module';
import { TableDetailsPage } from './table-details.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TableDetailsPageRoutingModule,
    LoaderModule,
    ReactiveFormsModule
  ],
  declarations: [TableDetailsPage],
  providers:[DatePipe]
})
export class TableDetailsPageModule {}
