import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistroyPageRoutingModule } from './histroy-routing.module';

import { HistroyPage } from './histroy.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistroyPageRoutingModule
  ],
  declarations: [HistroyPage]
})
export class HistroyPageModule {}
