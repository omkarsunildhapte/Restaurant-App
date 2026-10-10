import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

/** /main/* (formerly TabsPageRoutingModule). */
export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('../home/home.page').then((m) => m.HomePage)
      },
      {
        path: 'account',
        loadComponent: () => import('../Account_model/account/account.page').then((m) => m.AccountPage)
      },
      {
        path: 'table',
        loadComponent: () => import('../Table_booking/table/table.page').then((m) => m.TablePage)
      },
      {
        path: 'foods',
        loadComponent: () => import('../Food/foods/foods.page').then((m) => m.FoodsPage)
      },
      {
        path: 'food-review',
        loadComponent: () => import('../Food/food-review/food-review.page').then((m) => m.FoodReviewPage)
      },
      {
        path: 'confirm-order',
        loadComponent: () => import('../Food/confirm-order/confirm-order.page').then((m) => m.ConfirmOrderPage)
      },
      {
        path: 'track',
        loadComponent: () => import('../Food/track/track.page').then((m) => m.TrackPage)
      },
      {
        path: 'add-cart',
        loadComponent: () => import('../Food/add-cart/add-cart.page').then((m) => m.AddCartPage)
      }, 
      {
        path: 'account-information',
        loadComponent: () => import('../Account_model/account-information/account-information.page').then((m) => m.AccountInformationPage)
      },
      {
        path: 'change-password',
        loadComponent: () => import('../Account_model/change-password/change-password.page').then((m) => m.ChangePasswordPage)
      },
      {
        path: 'payment-method',
        loadComponent: () => import('../Account_model/payment-methods/payment-methods.page').then((m) => m.PaymentMethodsPage)
      },
      {
        path: 'table-details',
        loadComponent: () => import('../Table_booking/table-details/table-details.page').then((m) => m.TableDetailsPage)
      },
      {
        path: 'histroy',
        loadComponent: () => import('../Account_model/histroy/histroy.page').then((m) => m.HistroyPage)
      },
      {
        path: 'table-confirm',
        loadComponent: () => import('../Table_booking/table-confirm/table-confirm.page').then((m) => m.TableConfirmPage)
      }
    ]
  },
];
