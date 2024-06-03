import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegisterPageRoutingModule } from './register-routing.module';

import { RegisterPage } from './register.page';
import { LoaderModule } from 'src/app/loader/loader.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule.forRoot(),
    ReactiveFormsModule,
    RegisterPageRoutingModule,
    LoaderModule
  ],
  declarations: [RegisterPage]
})
export class RegisterPageModule {}
