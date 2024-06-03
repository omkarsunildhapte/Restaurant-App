import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from 'src/app/service/alert.service';
import { OtpService } from 'src/app/service/otp.service';
import { RoutingService } from 'src/app/service/routing.service';

@Component({
  selector: 'app-phone-number',
  templateUrl: './phone-number.page.html',
  styleUrls: ['./phone-number.page.scss'],
})
export class PhoneNumberPage implements OnInit {
  phoneNumberForm!: FormGroup;
  isLoading:boolean = false;
  isSubmit:boolean = false;
  constructor(
    private formBuilder: FormBuilder,
    public routerLink:RoutingService,
    private otpService: OtpService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.phoneNumberForm = this.formBuilder.group({
      phoneNumber: ['', Validators.required],
    })
  }
  onSubmit() {
    this.isSubmit = true;
    if(this.phoneNumberForm.valid){
      const uid = localStorage.getItem('uid');
      if (uid){
        const phoneNumber = this.phoneNumberForm.value.phoneNumber;
        this.isLoading = true;
        // this.otpService.sendOtp(phoneNumber).then(() => {
          this.isLoading = false;
          this.alertService.presentAlert(
            'OTP',
            '',
            'Send the Otp Successfully',
            'success'
          );
          const body ={
            phoneNumber : phoneNumber
          }
          this.routerLink.navigateUrl('/otp', body);
        // })
        // .catch(error => {
        // });
      }

    } else{
      this.phoneNumberForm.markAllAsTouched();
    }
  }

}
