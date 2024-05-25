import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistroyPage } from './histroy.page';

const routes: Routes = [
  {
    path: '',
    component: HistroyPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistroyPageRoutingModule {}
