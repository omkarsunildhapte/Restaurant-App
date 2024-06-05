import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PersonalDocumentPageRoutingModule } from './personal-document-routing.module';

import { PersonalDocumentPage } from './personal-document.page';
import { LoaderModule } from '../loader/loader.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PersonalDocumentPageRoutingModule,
    ReactiveFormsModule,
    LoaderModule
  ],
  declarations: [PersonalDocumentPage]
})
export class PersonalDocumentPageModule {}
