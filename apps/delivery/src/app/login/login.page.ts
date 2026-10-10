import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AlertService } from 'src/app/service/alert.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { RoutingService } from 'src/app/service/routing.service';
import { RiderDataService, RiderProfile } from 'src/app/core/data/rider.data.service';
import { LoadingComponent } from '../loader/loader.component';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem } from '@ionic/angular';
@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ReactiveFormsModule, LoadingComponent, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem],
})
export class LoginPage implements OnInit {
  readonly isLoading = signal(false);
  loginForm!: FormGroup;
  readonly isSubmit = signal(false);
  constructor(
    private formBuilder: FormBuilder,
    private authServies: AuthService,
    public routerLink: RoutingService,
    private riderData: RiderDataService,
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
    this.isSubmit.set(true);
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.isSubmit.set(false);
      const rawValue = this.loginForm.getRawValue()
      this.authServies.login(
        rawValue.email,
        rawValue.password
      ).subscribe(() => {
        this.isLoading.set(false);
        const uid = localStorage.getItem('uid');
        if (uid) {
          this.isLoading.set(true);
          this.riderData.getProfile(uid).subscribe(
            (data: RiderProfile | null) => {
              this.isLoading.set(false);
              this.alertService.presentAlert(
                'Login',
                '',
                'Login Successfully',
                'success'
              );
              if (data?.phoneNumber) {
                this.routerLink.navigateUrl('/main', undefined);
              } else {
                this.routerLink.navigateUrl('/phonenumber', undefined);
              }
            },
            (error: any) => {
              this.isLoading.set(false);
            }
          );
        }
      },
        (error) => {
          this.isLoading.set(false);
          this.alertService.presentError('Login', error, 'Login failed.');
        })
    } else {
      this.isLoading.set(false);
      this.loginForm.markAllAsTouched();
    }
  }
}
