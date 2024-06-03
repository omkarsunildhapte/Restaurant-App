import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { ChatsComponent } from './chats/chats.component';
import { ComboMakerComponent } from './combo-maker/combo-maker.component';
import { CommanLayoutComponent } from './comman-layout/comman-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FoodsComponent } from './foods/foods.component';
import { OrderListComponent } from './order-list/order-list.component';
import { RegisterComponent } from './register/register.component';
import { TableComponent } from './table/table.component';
import { LoginComponent } from './login/login.component';
import { BeverageComponent } from './beverage/beverage.component';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'main/dashboard' },
    { path: 'login', component: LoginComponent,canActivate:[authGuard] },
    { path: 'register', component: RegisterComponent },
    {
        path: 'main',
        component: CommanLayoutComponent,
        // canActivate:[authGuard],
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'dashboard', },
            { path: 'dashboard', component: DashboardComponent },
            { path: 'foods', component: FoodsComponent },
            { path: 'combo-maker', component: ComboMakerComponent },
            { path: 'order', component: OrderListComponent },
            { path: 'table', component: TableComponent },
            { path: 'chats', component: ChatsComponent },
            { path: 'beverage', component: BeverageComponent },
        ]
    }
];
