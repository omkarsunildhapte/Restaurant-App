import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HomePage } from './home.page';

import { HttpClientModule } from '@angular/common/http';
import { HomePageRoutingModule } from './home-routing.module';
import { TabsPageModule } from '../tabs/tabs.module';
import { LoaderModule } from '../loader/loader.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    HttpClientModule,
    HomePageRoutingModule,
    TabsPageModule,
    LoaderModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
