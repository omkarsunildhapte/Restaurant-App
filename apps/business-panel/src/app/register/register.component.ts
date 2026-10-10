import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

@Component({
    selector: 'app-register',
    imports: [RouterLink,
        ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './register.component.html'
})
export class RegisterComponent {
   fb = inject(FormBuilder);
   router = inject (Router);
   authServies = inject (AuthService);
   readonly configError = this.authServies.configError;
   readonly errorMessage = signal<string | null>(null);
   readonly submitting = signal(false);
   form = this.fb.nonNullable.group({
    name: ['',[Validators.required,Validators.minLength(3)]],
    email:['',[Validators.required,Validators.email]],
    password:['',[Validators.required,Validators.minLength(8)]]
   })
   async onSubmit(): Promise<void> {
    const rawValue  = this.form.getRawValue()
    if (this.form.valid && !this.submitting()){
      this.errorMessage.set(null);
      this.submitting.set(true);
      try {
        await this.authServies.signUp(rawValue.email, rawValue.password, { full_name: rawValue.name });
        await this.router.navigateByUrl('/login');
      } catch (error: any) {
        this.errorMessage.set(error?.message ?? 'Registration failed.');
      } finally {
        this.submitting.set(false);
      }
    }
   }
}
