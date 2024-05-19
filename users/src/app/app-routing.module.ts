import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'register',
    pathMatch: 'full'
  },
  {
    path: 'register',
    loadChildren: () => import('./auth/register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'forget',
    loadChildren: () => import('./auth/forget/forget.module').then(m => m.ForgetPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./auth/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path:'main',
    loadChildren:()=> import ('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'phonenumber',
    loadChildren: () => import('./auth/phone-number/phone-number.module').then( m => m.PhoneNumberPageModule)
  },
  {
    path: 'location',
    loadChildren: () => import('./Account_model/location/location.module').then( m => m.LocationPageModule)
  }


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
