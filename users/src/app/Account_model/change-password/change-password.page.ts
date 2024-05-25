import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoutingService } from 'src/app/service/routing.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
})
export class ChangePasswordPage implements OnInit {
  passwordForm: FormGroup;
  showPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder, 
    private authService: UserService,
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
      const currentPassword = this.passwordForm.value.currentPassword;
      const newPassword = this.passwordForm.value.newPassword;
      this.authService.updatePassword(currentPassword, newPassword).subscribe(
        () => {
          this.routerLink.navigateUrl('/main/account',undefined)
        },
        error => {
          console.error('Error updating password:', error);
        }
      );
    }
  }

}
