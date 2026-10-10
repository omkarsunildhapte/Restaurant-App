import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '@app/core/auth.store';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  protected readonly auth = inject(AuthStore);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly showPassword = signal(false);

  protected submit(): void {
    const email = this.email().trim();
    const password = this.password();
    if (!email || !password) return;

    this.auth.login(email, password);
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}
