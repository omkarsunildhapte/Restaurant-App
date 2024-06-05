import { Component, OnInit } from '@angular/core';
import { RoutingService } from '../service/routing.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../service/user.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-personal-information',
  templateUrl: './personal-information.page.html',
  styleUrls: ['./personal-information.page.scss'],
})
export class PersonalInformationPage implements OnInit {
  personalDetailsForm: FormGroup;
  isSubmit: boolean = false;
  isLoader: boolean = false;
  bloodGroups: string[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  
  constructor(
    private fb: FormBuilder,
    public routing: RoutingService,
    private userService:UserService,
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
    this.isSubmit = true;
    if (this.personalDetailsForm.valid) {
      this.isLoader=true;
      const uid = localStorage.getItem('uid');
      if(uid){
        const rawValue = this.personalDetailsForm.getRawValue();
        this.userService.updateAccount(uid,rawValue).subscribe((res:any)=>{
          this.isSubmit =this.isLoader=false;
          this.routing.navigateUrl('/personal-document',undefined)
        })
      }
    } else {
      this.personalDetailsForm.markAllAsTouched();
    }
  }
}
