import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem } from '@ionic/angular';
import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertService } from 'src/app/service/alert.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { RoutingService } from 'src/app/service/routing.service';
import { RouterLink } from '@angular/router';
import { LoadingComponent } from '../../loader/loader.component';

@Component({
    selector: 'app-forget',
    templateUrl: './forget.page.html',
    styleUrls: ['./forget.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem, RouterLink, FormsModule, ReactiveFormsModule, LoadingComponent]
})
export class ForgetPage implements OnInit {
  forgetPassword: FormControl = new FormControl('', [Validators.required,Validators.email]);
  readonly isLoading = signal<boolean>(false);
  isSubmit: boolean=false;
  constructor(
    private authService: AuthService,
    private routerLink:RoutingService,
    private alertService:AlertService
  ) {}

  ngOnInit() {
  }
  
  resetPassword() {
    const email = this.forgetPassword.value;
    this.isSubmit =true;
    if (this.forgetPassword.valid){
      this.isLoading.set(true);
      this.isSubmit = false;
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
        console.error('Error sending password reset email:', error);
        this.alertService.presentAlert('Forget Password', '', AuthService.messageOf(error), 'error');
      })
    } else{
      this.forgetPassword.markAllAsTouched();
    }
  }

}
