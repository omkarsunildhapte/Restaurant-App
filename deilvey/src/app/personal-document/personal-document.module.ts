import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PersonalDocumentPageRoutingModule } from './personal-document-routing.module';

import { PersonalDocumentPage } from './personal-document.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PersonalDocumentPageRoutingModule
  ],
  declarations: [PersonalDocumentPage]
})
export class PersonalDocumentPageModule {}
