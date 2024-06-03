import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-personal-document',
  templateUrl: './personal-document.page.html',
  styleUrls: ['./personal-document.page.scss'],
})
export class PersonalDocumentPage{
  @ViewChild('profile') profile!: ElementRef;
  @ViewChild('drivingLicence') drivingLicence!: ElementRef;
  @ViewChild('nationalId') nationalId!: ElementRef;

  documentForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.documentForm = this.fb.group({
      profile: [''],
      drivingLicence: [''],
      nationalId: ['']
    });
  }
  private inputRefs: { [key: string]: () => ElementRef<HTMLInputElement> } = {
    profile: () => this.profile,
    drivingLicence: () => this.drivingLicence,
    nationalId: () => this.nationalId,
  };

  triggerFileInput(option: string) {
    this.inputRefs[option]().nativeElement.click();
  }

  onFileSelected(event: any, type: string) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        this.documentForm.patchValue({ [type]: reader.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      this.documentForm.patchValue({ [type]: null });
    }
  }

  resetFileInput(type: string) {
    this.documentForm.patchValue({ [type]: null });
    this.inputRefs[type]().nativeElement.value = '';
  }
}
