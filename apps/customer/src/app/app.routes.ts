import { Routes } from '@angular/router';
import { authGuard } from './service/auth.guard';

/** Same URLs and guards as the former AppRoutingModule. */
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/main/home',
    pathMatch: 'full'
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.page').then((m) => m.RegisterPage)
  },
  {
    path: 'forget',
    loadComponent: () => import('./auth/forget/forget.page').then((m) => m.ForgetPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path:'main',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'phonenumber',
    loadComponent: () => import('./auth/phone-number/phone-number.page').then((m) => m.PhoneNumberPage),
    canActivate: [authGuard]
  },
  {
    path: 'location',
    loadComponent: () => import('./Account_model/location/location.page').then((m) => m.LocationPage),
    canActivate: [authGuard]
  },
  {
    path: 'otp',
    loadComponent: () => import('./auth/otp/otp.page').then((m) => m.OtpPage),
    canActivate: [authGuard]
  }
];
