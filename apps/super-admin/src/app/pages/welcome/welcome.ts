import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@app/core/auth.store';

const MIN_PASSWORD = 10;

/**
 * Where invite and password-reset emails land. The link has already signed the person in;
 * here they choose their own password and go on to the dashboard.
 */
@Component({
  selector: 'app-welcome',
  imports: [FormsModule, RouterLink],
  templateUrl: './welcome.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Welcome {
  protected readonly auth = inject(AuthStore);
  protected readonly min = MIN_PASSWORD;

  protected readonly password = signal('');
  protected readonly confirm = signal('');
  protected readonly problem = computed(() => {
    if (this.password().length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters`;
    if (this.confirm() && this.confirm() !== this.password()) return "The two passwords don't match";
    return null;
  });

  protected submit(): void {
    if (this.problem() || this.confirm() !== this.password()) return;
    void this.auth.setPassword(this.password());
  }
}
