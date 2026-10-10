import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { RoutingService } from '../service/routing.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RiderDataService } from '../core/data/rider.data.service';
import { isNotImplemented } from '../core/data/not-implemented';
import { AlertService } from '../service/alert.service';
import { DatePipe } from '@angular/common';
import { IonButton, IonCard, IonCardContent, IonContent, IonDatetime, IonHeader, IonIcon, IonInput, IonItem, IonModal, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
    selector: 'app-personal-information',
    templateUrl: './personal-information.page.html',
    styleUrls: ['./personal-information.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ReactiveFormsModule, IonButton, IonCard, IonCardContent, IonContent, IonDatetime, IonHeader, IonIcon, IonInput, IonItem, IonModal, IonSelect, IonSelectOption, IonTitle, IonToolbar],
    providers: [DatePipe],
})
export class PersonalInformationPage implements OnInit {
  personalDetailsForm: FormGroup;
  readonly isSubmit = signal(false);
  readonly isLoader = signal(false);
  bloodGroups: string[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  
  constructor(
    private fb: FormBuilder,
    public routing: RoutingService,
    private riderData:RiderDataService,
    private alertService:AlertService,
    private datePipe: DatePipe,
  ) {
    this.personalDetailsForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      fathersName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      mobileNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      bloodGroup: ['', Validators.required],
      city: ['', Validators.required],
      address: ['', Validators.required],
      deliveryLicenseId: ['', Validators.required],
      nationalId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
  }
  onDateChange(event: any) {
    const rawDate = event.detail.value;
    const formattedDate = this.datePipe.transform(rawDate, 'yyyy-MM-dd');
    this.personalDetailsForm.get('dateOfBirth')?.setValue(formattedDate);
  }

  onSubmit() {
    this.isSubmit.set(true);
    if (this.personalDetailsForm.valid) {
      this.isLoader.set(true);
      const uid = localStorage.getItem('uid');
      if(uid){
        const rawValue = this.personalDetailsForm.getRawValue();
        this.riderData.savePersonalInfo(uid,rawValue).subscribe({
          next: ()=>{
            this.isSubmit.set(false);
            this.isLoader.set(false);
            this.routing.navigateUrl('/personal-document',undefined)
          },
          error: (error: unknown)=>{
            this.isSubmit.set(false);
            this.isLoader.set(false);
            if (isNotImplemented(error)) {
              this.alertService.notConnectedYet();
            } else {
              this.alertService.presentError('Personal Information', error);
            }
          }
        })
      }
    } else {
      this.personalDetailsForm.markAllAsTouched();
    }
  }
}
