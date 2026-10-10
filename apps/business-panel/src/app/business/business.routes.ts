import type { Routes } from '@angular/router';
import { businessGuard, roleGuard } from './data/guards';

const t = (page: string) => page + ' · Business panel';

/** Mounted lazily at /business in app.routes.ts. */
export const BUSINESS_ROUTES: Routes = [
  {
    path: 'welcome',
    title: t('Welcome'),
    loadComponent: () => import('./pages/welcome/welcome-page').then((m) => m.WelcomePage),
  },
  {
    path: 'no-access',
    title: t('No access'),
    loadComponent: () => import('./pages/no-access/no-access-page').then((m) => m.NoAccessPage),
  },
  {
    path: '',
    canActivate: [businessGuard],
    loadComponent: () => import('./shell/shell').then((m) => m.BusinessShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: t('Dashboard'),
        canActivate: [roleGuard('admin', 'owner', 'manager')],
        loadComponent: () => import('./pages/dashboard/dashboard-page').then((m) => m.DashboardPage),
      },
      {
        path: 'setup',
        title: t('Setup'),
        canActivate: [roleGuard('admin', 'owner')],
        loadComponent: () => import('./pages/setup/setup-page').then((m) => m.SetupPage),
      },
      {
        path: 'orders',
        title: t('Orders'),
        canActivate: [roleGuard('admin', 'owner', 'manager')],
        loadComponent: () => import('./pages/orders/orders-page').then((m) => m.OrdersPage),
      },
      {
        path: 'menu',
        title: t('Menu'),
        loadComponent: () => import('./pages/menu/menu-page').then((m) => m.MenuPage),
      },
      {
        path: 'tables',
        title: t('Tables'),
        loadComponent: () => import('./pages/tables/tables-page').then((m) => m.TablesPage),
      },
      {
        path: 'staff',
        title: t('Staff'),
        canActivate: [roleGuard('admin', 'owner', 'manager')],
        loadComponent: () => import('./pages/staff/staff-page').then((m) => m.StaffPage),
      },
      {
        path: 'outlets',
        title: t('Outlets'),
        canActivate: [roleGuard('admin', 'owner', 'manager')],
        loadComponent: () => import('./pages/outlets/outlets-page').then((m) => m.OutletsPage),
      },
      {
        path: 'purchases',
        title: t('Purchases'),
        canActivate: [roleGuard('admin', 'owner', 'manager')],
        loadComponent: () => import('./pages/purchases/purchases-page').then((m) => m.PurchasesPage),
      },
      {
        path: 'salaries',
        title: t('Salaries'),
        canActivate: [roleGuard('admin', 'owner')],
        loadComponent: () => import('./pages/salaries/salaries-page').then((m) => m.SalariesPage),
      },
      {
        path: 'billing',
        title: t('Plan & billing'),
        canActivate: [roleGuard('admin', 'owner')],
        loadComponent: () => import('./pages/billing/billing-page').then((m) => m.BillingPage),
      },
      {
        path: 'settings',
        title: t('Settings'),
        canActivate: [roleGuard('admin', 'owner')],
        loadComponent: () => import('./pages/settings/settings-page').then((m) => m.SettingsPage),
      },
    ],
  },
];
