import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FormControl, Validators } from '@angular/forms';
import { AlertService } from 'src/app/service/alert.service';
import { AuthService } from 'src/app/service/auth.service';
import { RoutingService } from 'src/app/service/routing.service';

@Component({
  selector: 'app-forget',
  templateUrl: './forget.page.html',
  styleUrls: ['./forget.page.scss'],
})
export class ForgetPage implements OnInit {
  forgetPassword: FormControl = new FormControl('', [Validators.required,Validators.email]);
  isLoading: boolean=false;
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
      this.isLoading = true;
      this.isSubmit = false;
      this.authService.resetPassword(email).subscribe((res:any)=>{
      this.isLoading = false;
        this.routerLink.navigateUrl('/login',undefined);
        this.alertService.presentAlert(
          'Forget Password',
          '', 
          'Please check the Email box', 
          'success'
        );
      },
      (error) => {
        console.error('Error sending password reset email:', error);
      })
    } else{
      this.forgetPassword.markAllAsTouched();
    }
  }

}
