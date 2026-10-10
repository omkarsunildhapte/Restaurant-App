import { Routes } from '@angular/router';
import { guestGuard, modeGuard, signedInGuard, workingGuard } from '@app/core/guards';

const t = (page: string) => page + ' · Thaliyo Staff';

export const routes: Routes = [
  { path: 'login', title: t('Sign in'), canMatch: [guestGuard], loadComponent: () => import('@app/pages/login/login').then((m) => m.Login) },
  { path: 'choose', title: t('Choose outlet'), canMatch: [signedInGuard], loadComponent: () => import('@app/pages/choose/choose').then((m) => m.Choose) },
  {
    path: '',
    canMatch: [workingGuard],
    loadComponent: () => import('@app/layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('@app/pages/home').then((m) => m.Home) },
      { path: 'waiter', title: t('Tables'), canMatch: [modeGuard('waiter')], loadComponent: () => import('@app/pages/waiter/tables').then((m) => m.Tables) },
      { path: 'waiter/:orderId', title: t('Order'), canMatch: [modeGuard('waiter')], loadComponent: () => import('@app/pages/waiter/order-page').then((m) => m.OrderPage) },
      { path: 'kitchen', title: t('Kitchen'), canMatch: [modeGuard('kitchen')], loadComponent: () => import('@app/pages/kitchen/kitchen').then((m) => m.Kitchen) },
      { path: 'pos', title: t('POS'), canMatch: [modeGuard('pos')], loadComponent: () => import('@app/pages/pos/pos').then((m) => m.Pos) },
      { path: 'bills', title: t('Bills'), canMatch: [modeGuard('pos')], loadComponent: () => import('@app/pages/bills/bills').then((m) => m.Bills) },
      { path: 'day', title: t('Day'), canMatch: [modeGuard('pos')], loadComponent: () => import('@app/pages/day/day').then((m) => m.Day) },
    ],
  },
  { path: '**', redirectTo: '' },
];
