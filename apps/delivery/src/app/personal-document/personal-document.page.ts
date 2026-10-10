import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RiderDataService } from '../core/data/rider.data.service';
import { isNotImplemented } from '../core/data/not-implemented';
import { AlertService } from '../service/alert.service';
import { RoutingService } from '../service/routing.service';
import { LoadingComponent } from '../loader/loader.component';
import { IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonImg, IonTitle, IonToolbar } from '@ionic/angular';
interface Document {
  id: string;
  label: string;
  name: string;
  placeholder: string;
  value: string |null;
}

@Component({
    selector: 'app-personal-document',
    templateUrl: './personal-document.page.html',
    styleUrls: ['./personal-document.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ReactiveFormsModule, LoadingComponent, IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonImg, IonTitle, IonToolbar],
})
export class PersonalDocumentPage {
  documentForm: FormGroup;
  readonly isLoader = signal(false);
  documents: Document[] = [
    { id: 'file-upload-profile', label: 'Your Profile', name: 'profile', value: null, placeholder: 'Please select an image' },
    { id: 'file-upload-drivingLicence', label: 'Your Driving Licence', name: 'drivingLicence', value: null, placeholder: 'Please select an image' },
    { id: 'file-upload-nationalId', label: 'Your National Id', name: 'nationalId', value: null, placeholder: 'Please select an image' },
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private riderData: RiderDataService,
    private alertService: AlertService,
    public routing: RoutingService,
  ) {
    this.documentForm = this.formBuilder.group({
      profile: [null, [Validators.required]],
      drivingLicence: [null, [Validators.required]],
      nationalId: [null, [Validators.required]],
    });
  }

  onFileSelected(event: any, type: string) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const index = this.documents.findIndex(e => e.name == type);
        const dataURL = reader.result as string;
        this.documents[index].value = dataURL;
        this.documentForm.get(type)?.setValue(dataURL);
        // FileReader callbacks are outside Angular (zoneless): schedule a render.
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    } else {
      this.documentForm.patchValue({ [type]: null });
    }
  }

  triggerFileInput(type: string) {
    const element = document.getElementById(type) as HTMLInputElement;
    if (element) {
      element.value = '';
      element.click();
    }
  }

  resetFileInput(type: string) {
    const index = this.documents.findIndex(e => e.name == type);
    this.documents[index].value = '';
    this.documentForm.get(type)?.setValue(null);
  }

  submit() {
    if (this.documentForm.valid) {
      this.isLoader.set(true);
      const uid = localStorage.getItem('uid');
      const { profile, drivingLicence, nationalId } = this.documentForm.getRawValue();
      if (uid) {
        const personalStatus=0;
        const documentStatus=0
        this.riderData.saveDocuments(uid, { profile, drivingLicence, nationalId, personalStatus, documentStatus }).subscribe(() => {
          this.isLoader.set(false);
          this.routing.navigateUrl('/order',undefined)
        },
          (error: unknown) => {
            this.isLoader.set(false);
            if (isNotImplemented(error)) {
              this.alertService.notConnectedYet();
            } else {
              this.alertService.presentError('Personal Document', error);
            }
          }
        )
      }
    } else {
      this.documentForm.markAllAsTouched();
      if (this.documentForm.controls['profile'].invalid) {
        this.alertService.presentAlert(
          'Personal Document', 
          '', 
          'Please must be add the profile', 
          'error'
        );
      } else if (this.documentForm.controls['drivingLicence'].invalid) {
        this.alertService.presentAlert(
          'Personal Document', 
          '', 
          'Please must be add the Driving Licence', 
          'error'
        );
      } else if (this.documentForm.controls['nationalId'].invalid) {
        this.alertService.presentAlert(
          'Personal Document', 
          '', 
          'Please must be add the National Id', 
          'error'
        );
      }
    }
  }

}
