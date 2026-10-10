import { IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonList, IonText, IonTitle, IonToolbar } from '@ionic/angular';
import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RoutingService } from 'src/app/service/routing.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AlertService } from 'src/app/service/alert.service';
import { LoadingComponent } from '../../loader/loader.component';

@Component({
    selector: 'app-change-password',
    templateUrl: './change-password.page.html',
    styleUrls: ['./change-password.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonList, IonText, IonTitle, IonToolbar, FormsModule, ReactiveFormsModule, LoadingComponent]
})
export class ChangePasswordPage implements OnInit {
  passwordForm: FormGroup;
  showPassword:boolean = false;
  showNewPassword:boolean = false;
  showConfirmPassword:boolean = false;
  readonly isLoader = signal<boolean>(false);

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private alertService: AlertService,
    private routerLink:RoutingService
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordsMatch });
   }

  ngOnInit() {
  }

  passwordsMatch(group: FormGroup) {
    const newPassword = group.controls['newPassword'].value;
    const confirmPassword = group.controls['confirmPassword'].value;
    return newPassword === confirmPassword ? null : { match: true };
  }

  togglePasswordVisibility(field: string) {
    if (field === 'current') {
      this.showPassword = !this.showPassword;
    } else if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else if (field === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onSubmit() {
    if (this.passwordForm.valid) {
      this.isLoader.set(true);
      const currentPassword = this.passwordForm.value.currentPassword;
      const newPassword = this.passwordForm.value.newPassword;
      this.authService.updatePassword(currentPassword, newPassword).subscribe(
        () => {
          this.isLoader.set(false);
          this.routerLink.navigateUrl('/main/account',undefined)
        },
        error => {
          this.isLoader.set(false);
          console.error('Error updating password:', error);
          this.alertService.presentAlert('Password', '', AuthService.messageOf(error), 'error');
        }
      );
    }
  }

}
