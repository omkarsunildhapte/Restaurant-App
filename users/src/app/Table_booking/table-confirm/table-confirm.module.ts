import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TableConfirmPageRoutingModule } from './table-confirm-routing.module';

import { TableConfirmPage } from './table-confirm.page';
import { LoaderModule } from 'src/app/loader/loader.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TableConfirmPageRoutingModule,
    LoaderModule
  ],
  declarations: [TableConfirmPage]
})
export class TableConfirmPageModule {}
