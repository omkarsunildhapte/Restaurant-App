import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from 'src/app/service/alert.service';
import { AuthService } from 'src/app/service/auth.service';
import { RoutingService } from 'src/app/service/routing.service';
import { UserService } from 'src/app/service/user.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  isLoading: boolean = false;
  loginForm!: FormGroup;
  isSubmit: boolean = false;
  constructor(
    private formBuilder: FormBuilder,
    private authServies: AuthService,
    public routerLink: RoutingService,
    private userService: UserService,
    private alertService: AlertService
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
    this.isSubmit = true;
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.isSubmit = false;
      const rawValue = this.loginForm.getRawValue()
      this.authServies.login(
        rawValue.email,
        rawValue.password
      ).subscribe(() => {
        this.isLoading = false;
        const uid = localStorage.getItem('uid');
        if (uid) {
          this.isLoading = true;
          this.userService.getUserByUID(uid).subscribe(
            (data: any) => {
              this.isLoading = false;
              this.alertService.presentAlert(
                'Login',
                '',
                'Login Successfully',
                'success'
              );
              if (data.phoneNumber) {
                this.routerLink.navigateUrl('/main', undefined);
              } else {
                this.routerLink.navigateUrl('/phonenumber', undefined);
              }
            },
            (error: any) => {
              this.isLoading = false;
            }
          );
        }
      },
        (error) => {
          this.isLoading = false;
        })
    } else {
      this.isLoading = false;
      this.loginForm.markAllAsTouched();
    }
  }
}
