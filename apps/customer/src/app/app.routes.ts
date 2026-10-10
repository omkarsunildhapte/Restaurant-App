import { Routes } from '@angular/router';
import { APP_ROUTES, APP_ROUTE_LINKS } from '@constants/routes.constants';
import { authGuard } from '@guards/auth/auth.guard';

/**
 * Every entry is lazy (loadComponent), the layout shell included. URLs and guards are the same as
 * the old AppRoutingModule/TabsPageRoutingModule. The guard on `main` covers every tab screen.
 */
export const routes: Routes = [
  { path: APP_ROUTES.ROOT, redirectTo: APP_ROUTE_LINKS.HOME, pathMatch: 'full' },
  { path: APP_ROUTES.REGISTER, loadComponent: () => import('@pages/register/register').then((m) => m.Register) },
  { path: APP_ROUTES.FORGOT_PASSWORD, loadComponent: () => import('@pages/forgot-password/forgot-password').then((m) => m.ForgotPassword) },
  { path: APP_ROUTES.LOGIN, loadComponent: () => import('@pages/login/login').then((m) => m.Login) },
  {
    path: APP_ROUTES.MAIN,
    canActivate: [authGuard],
    loadComponent: () => import('@layout/tabs/tabs').then((m) => m.Tabs),
    children: [
      { path: APP_ROUTES.ROOT, redirectTo: APP_ROUTES.HOME, pathMatch: 'full' },
      { path: APP_ROUTES.HOME, loadComponent: () => import('@pages/home/home').then((m) => m.Home) },
      { path: APP_ROUTES.ACCOUNT, loadComponent: () => import('@pages/account/account').then((m) => m.Account) },
      { path: APP_ROUTES.TABLE, loadComponent: () => import('@pages/tables/tables').then((m) => m.Tables) },
      { path: APP_ROUTES.FOODS, loadComponent: () => import('@pages/foods/foods').then((m) => m.Foods) },
      { path: APP_ROUTES.FOOD_REVIEW, loadComponent: () => import('@pages/food-review/food-review').then((m) => m.FoodReview) },
      { path: APP_ROUTES.CONFIRM_ORDER, loadComponent: () => import('@pages/confirm-order/confirm-order').then((m) => m.ConfirmOrder) },
      { path: APP_ROUTES.TRACK, loadComponent: () => import('@pages/track/track').then((m) => m.Track) },
      { path: APP_ROUTES.CART, loadComponent: () => import('@pages/cart/cart').then((m) => m.Cart) },
      { path: APP_ROUTES.ACCOUNT_INFORMATION, loadComponent: () => import('@pages/account-information/account-information').then((m) => m.AccountInformation) },
      { path: APP_ROUTES.CHANGE_PASSWORD, loadComponent: () => import('@pages/change-password/change-password').then((m) => m.ChangePassword) },
      { path: APP_ROUTES.PAYMENT_METHODS, loadComponent: () => import('@pages/payment-methods/payment-methods').then((m) => m.PaymentMethods) },
      { path: APP_ROUTES.TABLE_DETAILS, loadComponent: () => import('@pages/table-details/table-details').then((m) => m.TableDetails) },
      { path: APP_ROUTES.HISTORY, loadComponent: () => import('@pages/order-history/order-history').then((m) => m.OrderHistory) },
      { path: APP_ROUTES.TABLE_CONFIRM, loadComponent: () => import('@pages/table-confirm/table-confirm').then((m) => m.TableConfirm) },
    ],
  },
  { path: APP_ROUTES.PHONE_NUMBER, canActivate: [authGuard], loadComponent: () => import('@pages/phone-number/phone-number').then((m) => m.PhoneNumber) },
  { path: APP_ROUTES.LOCATION, canActivate: [authGuard], loadComponent: () => import('@pages/delivery-location/delivery-location').then((m) => m.DeliveryLocation) },
  { path: APP_ROUTES.OTP, canActivate: [authGuard], loadComponent: () => import('@pages/otp/otp').then((m) => m.Otp) },
];
