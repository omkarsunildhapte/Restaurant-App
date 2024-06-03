import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TrackPageRoutingModule } from './track-routing.module';

import { LoaderModule } from 'src/app/loader/loader.module';
import { GeolocationService } from 'src/app/service/geolocation.service';
import { TrackPage } from './track.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TrackPageRoutingModule,
    LoaderModule
  ],
  declarations: [TrackPage],
  providers:[GeolocationService]
})
export class TrackPageModule {}
