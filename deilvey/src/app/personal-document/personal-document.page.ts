import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../service/user.service';
import { AlertService } from '../service/alert.service';
import { RoutingService } from '../service/routing.service';
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
})
export class PersonalDocumentPage {
  documentForm: FormGroup;
  isLoader: boolean = false;
  documents: Document[] = [
    { id: 'file-upload-profile', label: 'Your Profile', name: 'profile', value: null, placeholder: 'Please select an image' },
    { id: 'file-upload-drivingLicence', label: 'Your Driving Licence', name: 'drivingLicence', value: null, placeholder: 'Please select an image' },
    { id: 'file-upload-nationalId', label: 'Your National Id', name: 'nationalId', value: null, placeholder: 'Please select an image' },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
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
      this.isLoader = true;
      const uid = localStorage.getItem('uid');
      const { profile, drivingLicence, nationalId } = this.documentForm.getRawValue();
      if (uid) {
        const personalStatus=0;
        const documentStatus=0
        this.userService.updateDocument(uid, profile, drivingLicence, nationalId,personalStatus,documentStatus).subscribe((res: any) => {
          this.isLoader = false;
          this.routing.navigateUrl('/order',undefined)
        },
          (error: any) => {
            this.isLoader = false;
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
