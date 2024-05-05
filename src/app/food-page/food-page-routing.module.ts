import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FoodPagePage } from './food-page.page';

const routes: Routes = [
  {
    path: '',
    component: FoodPagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FoodPagePageRoutingModule {}
