import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/service/auth.service';
import { RoutingService } from 'src/app/service/routing.service';
import { UserService } from 'src/app/service/user.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  isLoading:boolean = false;
  loginForm!: FormGroup;
  constructor(
    private formBuilder: FormBuilder,
    private authServies :AuthService,
    public routerLink:RoutingService,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }
  get f() {
    return this.loginForm.controls;
  }
  async login() {
    const rawValue =  this.loginForm.getRawValue()
    this.authServies.login(
      rawValue.email,
      rawValue.password
    ).subscribe(()=>{
      this.isLoading =false;
      const uid = localStorage.getItem('uid'); 
      if (uid) {
      this.userService.getUserByUID(uid).subscribe(
        (data:any) => {
          if(data.phoneNumber){
            this.routerLink.navigateUrl('/main',undefined);
          } else{
            this.routerLink.navigateUrl('/phonenumber',undefined);
          }
          this.isLoading = false;
        },
        (error:any) => {
          this.isLoading = false;
        }
      );
      }
    },
    (error)=>{
      this.isLoading =false;
    })
  }
}
