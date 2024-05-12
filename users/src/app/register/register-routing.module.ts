import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RegisterPage } from './register.page';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../servies/auth.service';

const routes: Routes = [
  {
    path: '',
    component: RegisterPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes),HttpClientModule],
  exports: [RouterModule],
  providers:[AuthService]
})
export class RegisterPageRoutingModule {}
