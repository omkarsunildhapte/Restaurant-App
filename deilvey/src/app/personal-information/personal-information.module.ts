import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PersonalInformationPageRoutingModule } from './personal-information-routing.module';

import { PersonalInformationPage } from './personal-information.page';
import { LoaderModule } from '../loader/loader.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PersonalInformationPageRoutingModule,
    ReactiveFormsModule,
    LoaderModule
  ],
  declarations: [PersonalInformationPage],
  providers:[DatePipe]
})
export class PersonalInformationPageModule {}
