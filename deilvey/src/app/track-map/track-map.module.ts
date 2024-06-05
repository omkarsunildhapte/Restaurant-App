import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TrackMapPageRoutingModule } from './track-map-routing.module';

import { TrackMapPage } from './track-map.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TrackMapPageRoutingModule
  ],
  declarations: [TrackMapPage]
})
export class TrackMapPageModule {}
