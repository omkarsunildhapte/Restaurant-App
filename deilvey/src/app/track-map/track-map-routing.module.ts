import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TrackMapPage } from './track-map.page';

const routes: Routes = [
  {
    path: '',
    component: TrackMapPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TrackMapPageRoutingModule {}
