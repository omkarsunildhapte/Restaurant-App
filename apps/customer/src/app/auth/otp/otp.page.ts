import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonIcon, IonInput, IonItem } from '@ionic/angular';
import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/service/alert.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { RoutingService } from 'src/app/service/routing.service';

@Component({
    selector: 'app-otp',
    templateUrl: './otp.page.html',
    styleUrls: ['./otp.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonIcon, IonInput, IonItem, FormsModule, ReactiveFormsModule]
})
export class OtpPage implements OnInit {
  otpForm!: FormGroup;
  readonly isLoading = signal<boolean>(false);
  isSubmit:boolean = false;
  phoneNumber: string ='';
  constructor(
    private formBuilder: FormBuilder,
    public routerLink:RoutingService,
    private authService: AuthService,
    private alertService: AlertService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.otpForm = this.formBuilder.group({
      otp: ['', Validators.required],
    });
    this.phoneNumber = this.route.snapshot.queryParamMap.get('phoneNumber') ?? '';
  }
  async onSubmit() {
    this.isSubmit = true;
    if (this.otpForm.valid) {
      const otp = this.otpForm.value.otp;
      this.isLoading.set(true);
      const { error } = await this.authService.verifyOtp(this.phoneNumber, otp);
      this.isLoading.set(false);
      if (error) {
        console.error('Error verifying OTP:', error);
        this.alertService.presentAlert('OTP', '', AuthService.messageOf(error), 'error');
        return;
      }
      this.routerLink.navigateUrl('/location', undefined);
    }
  }
}
