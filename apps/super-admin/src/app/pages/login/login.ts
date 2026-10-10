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
  protected readonly resetSent = signal(false);

  protected submit(): void {
    const email = this.email().trim();
    const password = this.password();
    if (!email || !password) return;

    this.auth.login(email, password);
  }

  /** Emails a link to choose a new password, to the address typed above. */
  protected async forgot(): Promise<void> {
    const email = this.email().trim();
    if (!email) return;
    this.resetSent.set(await this.auth.sendReset(email));
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}
