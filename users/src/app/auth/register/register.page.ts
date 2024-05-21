import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';

import { catchError, finalize, of } from 'rxjs';
import { AlertService } from 'src/app/service/alert.service';
import { AuthService } from 'src/app/service/auth.service';
import { RoutingService } from 'src/app/service/routing.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  registrationForm: FormGroup;
  isLoading:boolean = false;
  isSubmit:boolean = false;
  constructor(
    private formBuilder: FormBuilder,
    public routerlink:RoutingService,
    private alertService: AlertService,
    private authService: AuthService
  ) { 
    this.registrationForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() {}

  passwordMatchValidator(formGroup:any): ValidationErrors | null {
    const password = formGroup.get('password').value;
    const confirmPassword = formGroup.get('confirmPassword').value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  get f() {
    return this.registrationForm.controls;
  }

  onSubmit(): void {
    this.isSubmit = true;
    if (this.registrationForm.valid) {
      this.isLoading = true;
      this.isSubmit = false;
      const rawValue = this.registrationForm.getRawValue();
      this.authService.register(rawValue.name, rawValue.email, rawValue.password)
        .pipe(
          finalize(() => {
            this.isLoading = false; 
          })
        )
        .subscribe(
          () => {
            this.routerlink.navigateUrl('/login', undefined);
          },
          (error) => {
            if (error.code == 'auth/email-already-in-use') {
              this.alertService.presentAlert('Registration Failed', '', 'The email address is already in use by another account', 'error');
            } else {
              this.alertService.presentAlert('Registration Failed', '', 'There had issue in  email address is already in use by another account', 'error');
            }
          }
        );
    } else {
      this.registrationForm.markAllAsTouched();
    }
  }
  
  
  async signInWithGoogle() {
  }

  async signInWithFacebook() {
   
  }
}
