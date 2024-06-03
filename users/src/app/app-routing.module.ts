import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './service/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/main/home',
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
    loadChildren: () => import('./auth/login/login.module').then(m => m.LoginPageModule),
  },
  {
    path:'main',
    loadChildren:()=> import ('./tabs/tabs.module').then(m => m.TabsPageModule),
    canActivate: [authGuard]
  },
  {
    path: 'phonenumber',
    loadChildren: () => import('./auth/phone-number/phone-number.module').then( m => m.PhoneNumberPageModule),
    canActivate: [authGuard]
  },
  {
    path: 'location',
    loadChildren: () => import('./Account_model/location/location.module').then( m => m.LocationPageModule),
    canActivate: [authGuard]
  },
  {
    path: 'otp',
    loadChildren: () => import('./auth/otp/otp.module').then( m => m.OtpPageModule),
    canActivate: [authGuard]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
