import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem } from '@ionic/angular';
import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertService } from 'src/app/service/alert.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { RoutingService } from 'src/app/service/routing.service';
import { LoadingComponent } from '../../loader/loader.component';
@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem, FormsModule, ReactiveFormsModule, LoadingComponent]
})
export class LoginPage implements OnInit {
  readonly isLoading = signal<boolean>(false);
  loginForm!: FormGroup;
  isSubmit: boolean = false;
  constructor(
    private formBuilder: FormBuilder,
    private authServies: AuthService,
    public routerLink: RoutingService,
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
      this.isLoading.set(true);
      this.isSubmit = false;
      const rawValue = this.loginForm.getRawValue()
      this.authServies.login(
        rawValue.email,
        rawValue.password
      ).subscribe((user) => {
        this.isLoading.set(false);
        this.alertService.presentAlert(
          'Login',
          '',
          'Login Successfully',
          'success'
        );
        if (user.phone) {
          this.routerLink.navigateUrl('/main', undefined);
        } else {
          this.routerLink.navigateUrl('/phonenumber', undefined);
        }
      },
        (error) => {
          this.isLoading.set(false);
          this.alertService.presentAlert('Login Failed', '', AuthService.messageOf(error), 'error');
        })
    } else {
      this.isLoading.set(false);
      this.loginForm.markAllAsTouched();
    }
  }
}
