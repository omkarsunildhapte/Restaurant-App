import { Routes } from '@angular/router';
import { CommanLayoutComponent } from './comman-layout/comman-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FoodsComponent } from './foods/foods.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ComboMakerComponent } from './combo-maker/combo-maker.component';
import { OrderListComponent } from './order-list/order-list.component';
import { TableComponent } from './table/table.component';
import { ChatsComponent } from './chats/chats.component';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'login' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: 'main',
        component: CommanLayoutComponent,
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'dashboard', },
            { path: 'dashboard', component: DashboardComponent },
            { path: 'foods', component: FoodsComponent },
            { path: 'combo-maker', component: ComboMakerComponent },
            { path: 'order', component: OrderListComponent },
            { path: 'table', component: TableComponent },
            { path: 'chats', component: ChatsComponent },
        ]
    }
];
