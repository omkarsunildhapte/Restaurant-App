import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { AlertService } from 'src/app/service/alert.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { RoutingService } from 'src/app/service/routing.service';
import { RouterLink } from '@angular/router';
import { LoadingComponent } from '../loader/loader.component';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem } from '@ionic/angular';

@Component({
    selector: 'app-forget',
    templateUrl: './forget.page.html',
    styleUrls: ['./forget.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ReactiveFormsModule, RouterLink, LoadingComponent, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem],
})
export class ForgetPage implements OnInit {
  forgetPassword: FormControl = new FormControl('', [Validators.required,Validators.email]);
  readonly isLoading = signal(false);
  readonly isSubmit = signal(false);
  constructor(
    private authService: AuthService,
    private routerLink:RoutingService,
    private alertService:AlertService
  ) {}

  ngOnInit() {
  }
  
  resetPassword() {
    const email = this.forgetPassword.value;
    this.isSubmit.set(true);
    if (this.forgetPassword.valid){
      this.isLoading.set(true);
      this.isSubmit.set(false);
      this.authService.resetPassword(email).subscribe((res:any)=>{
      this.isLoading.set(false);
        this.routerLink.navigateUrl('/login',undefined);
        this.alertService.presentAlert(
          'Forget Password',
          '', 
          'Please check the Email box', 
          'success'
        );
      },
      (error) => {
        this.isLoading.set(false);
        this.alertService.presentError('Forget Password', error, 'Could not send the reset e-mail.');
      })
    } else{
      this.forgetPassword.markAllAsTouched();
    }
  }

}
