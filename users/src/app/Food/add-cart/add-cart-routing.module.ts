import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddCartPage } from './add-cart.page';

const routes: Routes = [
  {
    path: '',
    component: AddCartPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddCartPageRoutingModule {}
