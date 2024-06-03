import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistroyPageRoutingModule } from './histroy-routing.module';

import { HistroyPage } from './histroy.page';
import { LoaderModule } from 'src/app/loader/loader.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistroyPageRoutingModule,
    LoaderModule
  ],
  declarations: [HistroyPage]
})
export class HistroyPageModule {}
