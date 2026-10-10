import { Routes } from '@angular/router';
import { authGuard } from '@guards/auth/auth.guard';
import { APP_ROUTES } from '@constants/routes.constants';

/**
 * Riders are invite-only: no sign-up; the invite link lands on /welcome. Public screens stand alone; every signed-in screen is a child of one
 * componentless parent route, so the guard on the parent covers them all (the app has no shell
 * UI such as tabs, so there is no layout component). Every entry is lazy (loadComponent).
 */
export const routes: Routes = [
  { path: '', redirectTo: APP_ROUTES.LOGIN, pathMatch: 'full' },
  { path: APP_ROUTES.WELCOME, loadComponent: () => import('@pages/welcome/welcome').then((m) => m.Welcome) },
  { path: APP_ROUTES.LOGIN, loadComponent: () => import('@pages/login/login').then((m) => m.Login) },
  { path: APP_ROUTES.FORGOT_PASSWORD, loadComponent: () => import('@pages/forgot-password/forgot-password').then((m) => m.ForgotPassword) },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: APP_ROUTES.PERSONAL_INFORMATION, loadComponent: () => import('@pages/personal-information/personal-information').then((m) => m.PersonalInformation) },
      { path: APP_ROUTES.PERSONAL_DOCUMENT, loadComponent: () => import('@pages/personal-document/personal-document').then((m) => m.PersonalDocument) },
      { path: APP_ROUTES.VEHICLE_DETAILS, loadComponent: () => import('@pages/vehicle-details/vehicle-details').then((m) => m.VehicleDetails) },
      { path: APP_ROUTES.BANK_DETAILS, loadComponent: () => import('@pages/bank-details/bank-details').then((m) => m.BankDetails) },
      { path: APP_ROUTES.ORDER, loadComponent: () => import('@pages/order/order').then((m) => m.Order) },
      { path: APP_ROUTES.ACCOUNT, loadComponent: () => import('@pages/account/account').then((m) => m.Account) },
      { path: APP_ROUTES.TRACK_MAP, loadComponent: () => import('@pages/track-map/track-map').then((m) => m.TrackMap) },
    ],
  },
];
