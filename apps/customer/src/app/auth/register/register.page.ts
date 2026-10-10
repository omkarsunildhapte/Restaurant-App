import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem } from '@ionic/angular';
import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, FormGroup, ValidationErrors, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { finalize } from 'rxjs';
import { AlertService } from 'src/app/service/alert.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { RoutingService } from 'src/app/service/routing.service';
import { LoadingComponent } from '../../loader/loader.component';

@Component({
    selector: 'app-register',
    templateUrl: './register.page.html',
    styleUrls: ['./register.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem, FormsModule, ReactiveFormsModule, LoadingComponent]
})
export class RegisterPage implements OnInit {
  registrationForm: FormGroup;
  readonly isLoading = signal<boolean>(false);
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
      this.isLoading.set(true);
      this.isSubmit = false;
      const rawValue = this.registrationForm.getRawValue();
      this.authService.register(rawValue.name, rawValue.email, rawValue.password)
        .pipe(
          finalize(() => {
            this.isLoading.set(false); 
          })
        )
        .subscribe(
          () => {
            this.routerlink.navigateUrl('/login', undefined);
            this.alertService.presentAlert(
              'Registration Success', 
              '', 
              'The Account Created Successfully', 
              'success'
            );
          },
          (error) => {
            if (error?.code == 'user_already_exists' || error?.code == 'email_exists') {
              this.alertService.presentAlert(
                'Registration Failed', 
                '', 
                'The email address is already in use by another account', 
                'error'
              );
            } else {
              this.alertService.presentAlert('Registration Failed', '', AuthService.messageOf(error), 'error');
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
