import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/service/alert.service';
import { OtpService } from 'src/app/service/otp.service';
import { RoutingService } from 'src/app/service/routing.service';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.page.html',
  styleUrls: ['./otp.page.scss'],
})
export class OtpPage implements OnInit {
  otpForm!: FormGroup;
  isLoading:boolean = false;
  isSubmit:boolean = false;
  phoneNumber: string ='';
  constructor(
    private formBuilder: FormBuilder,
    public routerLink:RoutingService,
    private otpService: OtpService,
    private alertService: AlertService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.otpForm = this.formBuilder.group({
      otp: ['', Validators.required],
    });
    // this.phoneNumber = this.route.snapshot.params;
  }
  onSubmit() {
    this.isSubmit = true;
    if (this.otpForm.valid) {
      const otp = this.otpForm.value.otp;
      this.isLoading = true;
      // this.otpService.verifyOtp(this.phoneNumber, otp).then(() => {
      //   this.isLoading = false;
      // this.userService.updatePhoneNumber(
      //   uid,
      //   this.phoneNumberForm.value.phoneNumber
      // ).subscribe((res:any)=>{
      //   this.routerLink.navigateUrl('/location',undefined)
      // })
      // }).catch(error => {
      //   this.isLoading = false;
      //   console.error('Error verifying OTP:', error);
      //   // Handle error - show alert or toast message
      // });
    }
  }
}
