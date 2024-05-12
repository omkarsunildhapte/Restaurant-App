import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AlertComponent } from 'src/components/alert/alert.component';
import { FeedbackComponent } from 'src/components/feedback/feedback.component';
import { OrderHistoryComponent } from 'src/components/order-history/order-history.component';
import { PaymentComponent } from 'src/components/payment/payment.component';
import { RateShopComponent } from 'src/components/rate-shop/rate-shop.component';
import { RateShop1Component } from 'src/components/rate-shop1/rate-shop1.component';

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
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'mypopover',
    loadChildren: () => import('./mypopover/mypopover.module').then(m => m.MypopoverPageModule)
  },
  { path: "alert", component: AlertComponent },
  { path: "feedback", component: FeedbackComponent },
  { path: "rate", component: RateShopComponent },
  { path: "rate1", component: RateShop1Component },
  { path: "payment", component: PaymentComponent },
  { path: "order", component: OrderHistoryComponent }


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
