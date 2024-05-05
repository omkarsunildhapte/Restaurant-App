import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MypopoverPage } from './mypopover.page';

const routes: Routes = [
  {
    path: '',
    component: MypopoverPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MypopoverPageRoutingModule {}
