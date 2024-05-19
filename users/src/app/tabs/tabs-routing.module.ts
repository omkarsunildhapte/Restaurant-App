import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TabsPage } from './tabs.page';

const routes: Routes = [
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
        loadChildren: () => import('../home/home.module').then(m => m.HomePageModule)
      },
      {
        path: 'account',
        loadChildren: () => import('../Account_model/account/account.module').then(m => m.AccountPageModule)
      },
      {
        path: 'table',
        loadChildren: () => import('../Table_booking/table/table.module').then(m => m.TablePageModule)
      },
      {
        path: 'foods',
        loadChildren: () => import('../Food/foods/foods.module').then(m => m.FoodsPageModule)
      },
      {
        path: 'food-review',
        loadChildren: () => import('../Food/food-review/food-review.module').then(m => m.FoodReviewPageModule)
      },
      {
        path: 'confirm-order',
        loadChildren: () => import('../Food/confirm-order/confirm-order.module').then(m => m.ConfirmOrderPageModule)
      },
      {
        path: 'track',
        loadChildren: () => import('../Food/track/track.module').then(m => m.TrackPageModule)
      },
      {
        path: 'add-cart',
        loadChildren: () => import('../Food/add-cart/add-cart.module').then(m => m.AddCartPageModule)
      }, {
        path: 'account-information',
        loadChildren: () => import('../Account_model/account-information/account-information.module').then( m => m.AccountInformationPageModule)
      },
      {
        path: 'change-password',
        loadChildren: () => import('../Account_model/change-password/change-password.module').then( m => m.ChangePasswordPageModule)
      },
      {
        path: 'payment-method',
        loadChildren: () => import('../Account_model/payment-methods/payment-methods.module').then( m => m.PaymentMethodsPageModule)
      },
      {
        path: 'table-detials',
        loadChildren: () => import('../Table_booking/table-details/table-details.module').then( m => m.TableDetailsPageModule)
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule { }
