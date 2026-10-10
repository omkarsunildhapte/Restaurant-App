import { Routes } from '@angular/router';

/** Same URLs as the old AppRoutingModule; each page is lazy-loaded as a standalone component. */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'register',
    pathMatch: 'full',
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'forget',
    loadComponent: () => import('./forget/forget.page').then((m) => m.ForgetPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'personal-information',
    loadComponent: () =>
      import('./personal-information/personal-information.page').then((m) => m.PersonalInformationPage),
  },
  {
    path: 'personal-document',
    loadComponent: () =>
      import('./personal-document/personal-document.page').then((m) => m.PersonalDocumentPage),
  },
  {
    path: 'vehicle-details',
    loadComponent: () => import('./vehicle-details/vehicle-details.page').then((m) => m.VehicleDetailsPage),
  },
  {
    path: 'backing-details',
    loadComponent: () => import('./backing-details/backing-details.page').then((m) => m.BackingDetailsPage),
  },
  {
    path: 'order',
    loadComponent: () => import('./order/order.page').then((m) => m.OrderPage),
  },
  {
    path: 'account',
    loadComponent: () => import('./account/account.page').then((m) => m.AccountPage),
  },
  {
    path: 'track-map',
    loadComponent: () => import('./track-map/track-map.page').then((m) => m.TrackMapPage),
  },
];
