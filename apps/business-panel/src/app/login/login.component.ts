import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
@Component({
    selector: 'app-login',
    imports: [
        RouterLink, ReactiveFormsModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './login.component.html'
})
export class LoginComponent {
  fb = inject(FormBuilder);
  router = inject (Router);
  authServies = inject (AuthService);
  readonly configError = this.authServies.configError;
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);
  form = this.fb.nonNullable.group({
   email:['',[Validators.required,Validators.email]],
   password:['',[Validators.required,Validators.minLength(8)]]
  })
  async onSubmit(): Promise<void> {
    const rawValue  = this.form.getRawValue()
    if (this.form.valid && !this.submitting()){
      this.errorMessage.set(null);
      this.submitting.set(true);
      try {
        await this.authServies.signIn(rawValue.email, rawValue.password);
        await this.router.navigateByUrl('/business');
      } catch (error: any) {
        this.errorMessage.set(error?.message ?? 'Sign in failed.');
      } finally {
        this.submitting.set(false);
      }
    }
   }
}
