import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/service/auth.service';
import { RoutingService } from 'src/app/service/routing.service';

@Component({
  selector: 'app-forget',
  templateUrl: './forget.page.html',
  styleUrls: ['./forget.page.scss'],
})
export class ForgetPage implements OnInit {
  forgetPassword: FormControl = new FormControl([Validators.required,Validators.email]);
  constructor(
    private authService: AuthService,
    private routerLink:RoutingService
  ) {}

  ngOnInit() {
  }
  
  resetPassword() {
    const email = this.forgetPassword.value;
    if (this.forgetPassword.valid){
      this.authService.resetPassword(email).subscribe((res:any)=>{
        this.routerLink.navigateUrl('/login',undefined)
      },
      (error) => {
        console.error('Error sending password reset email:', error);
      })
    } else{
      this.forgetPassword.markAllAsTouched();
    }
  }

}
