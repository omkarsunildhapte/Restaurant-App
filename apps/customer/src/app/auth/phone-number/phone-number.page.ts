import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonIcon, IonInput, IonItem } from '@ionic/angular';
import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertService } from 'src/app/service/alert.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { RoutingService } from 'src/app/service/routing.service';

@Component({
    selector: 'app-phone-number',
    templateUrl: './phone-number.page.html',
    styleUrls: ['./phone-number.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonIcon, IonInput, IonItem, FormsModule, ReactiveFormsModule]
})
export class PhoneNumberPage implements OnInit {
  phoneNumberForm!: FormGroup;
  readonly isLoading = signal<boolean>(false);
  isSubmit:boolean = false;
  constructor(
    private formBuilder: FormBuilder,
    public routerLink:RoutingService,
    private authService: AuthService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.phoneNumberForm = this.formBuilder.group({
      phoneNumber: ['', Validators.required],
    })
  }
  async onSubmit() {
    this.isSubmit = true;
    if(this.phoneNumberForm.valid){
      const phoneNumber = this.phoneNumberForm.value.phoneNumber;
      this.isLoading.set(true);
      const { error } = await this.authService.sendOtp(phoneNumber);
      this.isLoading.set(false);
      if (error) {
        this.alertService.presentAlert('OTP', '', AuthService.messageOf(error), 'error');
        return;
      }
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
    } else{
      this.phoneNumberForm.markAllAsTouched();
    }
  }

}
