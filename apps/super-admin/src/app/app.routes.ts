import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@app/core/auth.guard';
import { superAdminGuard } from '@app/core/platform/super-admin.guard';

const t = (page: string) => page + ' · Thaliyo Admin';

export const routes: Routes = [
  {
    path: 'login',
    title: t('Sign in'),
    canMatch: [guestGuard],
    loadComponent: () => import('@app/pages/login/login').then((m) => m.Login),
  },
  {
    // Invite and password-reset links land here (signed in by the link) to choose a password.
    path: 'welcome',
    title: t('Set your password'),
    loadComponent: () => import('@app/pages/welcome/welcome').then((m) => m.Welcome),
  },
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () => import('@app/layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: t('Sales dashboard'),
        loadComponent: () => import('@app/pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'leads',
        title: t('Pipeline'),
        loadComponent: () => import('@app/pages/leads/leads').then((m) => m.Leads),
      },
      {
        path: 'leads/new',
        title: t('New lead'),
        loadComponent: () => import('@app/pages/lead-form/lead-form').then((m) => m.LeadForm),
      },
      {
        path: 'leads/:id/edit',
        title: t('Edit lead'),
        loadComponent: () => import('@app/pages/lead-form/lead-form').then((m) => m.LeadForm),
      },
      {
        path: 'leads/:id',
        title: t('Lead'),
        loadComponent: () => import('@app/pages/lead-detail/lead-detail').then((m) => m.LeadDetail),
      },
      {
        path: 'follow-ups',
        title: t('Follow-ups'),
        loadComponent: () => import('@app/pages/follow-ups/follow-ups').then((m) => m.FollowUps),
      },
      {
        path: 'areas',
        title: t('Areas'),
        loadComponent: () => import('@app/pages/areas/areas').then((m) => m.Areas),
      },
      {
        path: 'import',
        title: t('Import leads'),
        loadComponent: () => import('@app/pages/import/import').then((m) => m.Import),
      },
      {
        path: 'dealers',
        title: t('Dealers'),
        loadComponent: () => import('@app/pages/dealers/dealers').then((m) => m.Dealers),
      },
      {
        path: 'team',
        title: t('Team'),
        loadComponent: () => import('@app/pages/team/team').then((m) => m.Team),
      },
      {
        path: 'billing',
        title: t('Billing'),
        canMatch: [superAdminGuard],
        loadComponent: () => import('@app/pages/billing/billing').then((m) => m.Billing),
      },
      {
        path: 'platform',
        canMatch: [superAdminGuard],
        title: t('Platform'),
        loadComponent: () => import('@app/pages/platform/overview/overview').then((m) => m.PlatformOverview),
      },
      {
        path: 'platform/restaurants',
        canMatch: [superAdminGuard],
        title: t('Restaurants'),
        loadComponent: () => import('@app/pages/platform/restaurants/restaurants').then((m) => m.PlatformRestaurants),
      },
      {
        path: 'platform/restaurants/:id',
        canMatch: [superAdminGuard],
        title: t('Restaurant'),
        loadComponent: () =>
          import('@app/pages/platform/restaurant-detail/restaurant-detail').then((m) => m.PlatformRestaurantDetail),
      },
      {
        path: 'platform/plans',
        canMatch: [superAdminGuard],
        title: t('Plans'),
        loadComponent: () => import('@app/pages/platform/plans/plans').then((m) => m.PlatformPlans),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
