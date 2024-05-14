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
        loadChildren: () => import('../account/account.module').then(m => m.AccountPageModule)
      },
      {
        path: 'table',
        loadChildren: () => import('../table/table.module').then(m => m.TablePageModule)
      },
      {
        path: 'foods',
        loadChildren: () => import('../foods/foods.module').then(m => m.FoodsPageModule)
      },
      {
        path: 'food-review',
        loadChildren: () => import('../food-review/food-review.module').then(m => m.FoodReviewPageModule)
      },
      {
        path: 'confirm-order',
        loadChildren: () => import('../confirm-order/confirm-order.module').then(m => m.ConfirmOrderPageModule)
      },
      {
        path: 'track',
        loadChildren: () => import('../track/track.module').then(m => m.TrackPageModule)
      },
      {
        path: 'add-cart',
        loadChildren: () => import('../add-cart/add-cart.module').then(m => m.AddCartPageModule)
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule { }
