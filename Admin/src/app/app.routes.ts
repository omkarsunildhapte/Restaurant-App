import { Routes } from '@angular/router';
import { CommanLayoutComponent } from './comman-layout/comman-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FoodsComponent } from './foods/foods.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

export const routes: Routes = [
    {path:'',pathMatch:'full',redirectTo: 'login'},
    {path:'login',component:LoginComponent},
    {path:'register',component:RegisterComponent},
    {
        path:'mains',
        component:CommanLayoutComponent,
        children:[
            {path:'',pathMatch:'full',redirectTo: 'dashboard',},
            { path :'dashboard',component:DashboardComponent},
            { path:'foods',component:FoodsComponent},
            // { path :''}
        ]
    }
];
