import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'register',
    pathMatch: 'full'
  },
  {
    path: 'register',
    loadChildren: () => import('./register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'forget',
    loadChildren: () => import('./forget/forget.module').then(m => m.ForgetPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path:'home',
    loadChildren:()=> import ('./home/home.module').then(m => m.HomePageModule)
  },
  {
    path:'account',
    loadChildren:()=> import ('./account/account.module').then(m => m.AccountPageModule)
  },
  {
    path: 'account-information',
    loadChildren: () => import('./account-information/account-information.module').then( m => m.AccountInformationPageModule)
  },
  {
    path: 'change-password',
    loadChildren: () => import('./change-password/change-password.module').then( m => m.ChangePasswordPageModule)
  },
  {
    path: 'payment-method',
    loadChildren: () => import('./payment-methods/payment-methods.module').then( m => m.PaymentMethodsPageModule)
  },
  {
    path: 'confirm-order',
    loadChildren: () => import('./confirm-order/confirm-order.module').then( m => m.ConfirmOrderPageModule)
  },
  {
    path: 'food-review',
    loadChildren: () => import('./food-review/food-review.module').then( m => m.FoodReviewPageModule)
  },
  {
    path: 'track',
    loadChildren: () => import('./track/track.module').then( m => m.TrackPageModule)
  },
  {
    path: 'table-detials',
    loadChildren: () => import('./table-details/table-details.module').then( m => m.TableDetailsPageModule)
  },
  {
    path: 'table',
    loadChildren: () => import('./table/table.module').then( m => m.TablePageModule)
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
