import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TableDetailsPage } from './table-details.page';

const routes: Routes = [
  {
    path: '',
    component: TableDetailsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TableDetailsPageRoutingModule {}
