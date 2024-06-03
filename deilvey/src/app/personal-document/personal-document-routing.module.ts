import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PersonalDocumentPage } from './personal-document.page';

const routes: Routes = [
  {
    path: '',
    component: PersonalDocumentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PersonalDocumentPageRoutingModule {}
