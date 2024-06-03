import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BackingDetailsPage } from './backing-details.page';

const routes: Routes = [
  {
    path: '',
    component: BackingDetailsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BackingDetailsPageRoutingModule {}
