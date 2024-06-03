import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TableConfirmPage } from './table-confirm.page';

const routes: Routes = [
  {
    path: '',
    component: TableConfirmPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TableConfirmPageRoutingModule {}
