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
        path:'home',
        loadChildren:()=> import ('../home/home.module').then(m => m.HomePageModule)
      },
      {
        path:'account',
        loadChildren:()=> import ('../account/account.module').then(m => m.AccountPageModule)
      },
      {
        path: 'account-information',
        loadChildren: () => import('../account-information/account-information.module').then( m => m.AccountInformationPageModule)
      },
      {
        path: 'change-password',
        loadChildren: () => import('../change-password/change-password.module').then( m => m.ChangePasswordPageModule)
      },
      {
        path: 'payment-method',
        loadChildren: () => import('../payment-methods/payment-methods.module').then( m => m.PaymentMethodsPageModule)
      },
      {
        path: 'confirm-order',
        loadChildren: () => import('../confirm-order/confirm-order.module').then( m => m.ConfirmOrderPageModule)
      },
      {
        path: 'food-review',
        loadChildren: () => import('../food-review/food-review.module').then( m => m.FoodReviewPageModule)
      }
    ]
  }, 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule { }
