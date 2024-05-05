import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadChildren: () => import('./../home/home.module').then(m => m.HomePageModule)
      },
      {
        path: 'account',
        loadChildren: () => import('./../account/account.module').then(m => m.AccountPageModule)
      },
      {
        path: 'food',
        loadChildren: () => import('./../food-page/food-page.module').then(m => m.FoodPagePageModule)
      },
      {
        path: 'table-details',
        loadChildren: () => import('./../table-details/table-details.module').then(m => m.TableDetailsPageModule)
      },
      {
        path: '',
        redirectTo: 'tabs/home',
        pathMatch: 'full'
      }
    ]
  }, 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule { }
