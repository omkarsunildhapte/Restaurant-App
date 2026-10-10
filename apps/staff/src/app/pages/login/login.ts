import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SessionStore } from '@app/core/session.store';
import { supabaseConfigError } from '@app/core/supabase.client';
import { TPipe } from '@app/core/i18n';
import { LangSwitch } from '@app/pages/shared/lang-switch';

@Component({
  selector: 'app-login',
  imports: [FormsModule, TPipe, LangSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex min-h-dvh items-center justify-center bg-ink-50 px-4 py-10">
      <div class="w-full max-w-sm">
        <div class="mb-6 text-center">
          <img src="brand/thaliyo-logo-600.webp" alt="Thaliyo, Restaurant &amp; Cafe Management System" width="600" height="440" class="mx-auto h-auto w-56" />
          <p class="mt-2 text-sm font-medium text-ink-500">{{ 'login.tagline' | t }}</p>
        </div>
        <div class="mb-4"><app-lang-switch /></div>
        <div class="card p-6">
          <h1 class="text-lg font-semibold text-ink-900">{{ 'login.title' | t }}</h1>
          <p class="mt-1 text-sm text-ink-500">{{ 'login.hint' | t }}</p>
          @if (configError) {
            <p class="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">{{ configError }}</p>
          }
          @if (session.error()) {
            <p class="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800" role="alert">{{ session.error() }}</p>
          }
          <form class="mt-5 flex flex-col gap-4" (ngSubmit)="submit()">
            <div>
              <label for="email" class="field-label">{{ 'login.email' | t }}</label>
              <input id="email" name="email" type="email" autocomplete="username" required [ngModel]="email()" (ngModelChange)="email.set($event)" class="field" />
            </div>
            <div>
              <label for="password" class="field-label">{{ 'login.password' | t }}</label>
              <input id="password" name="password" type="password" autocomplete="current-password" required [ngModel]="password()" (ngModelChange)="password.set($event)" class="field" />
            </div>
            <button type="submit" class="btn-primary py-3 text-base" [disabled]="session.busy() || !email().trim() || !password()">
              {{ (session.busy() ? 'login.busy' : 'login.submit') | t }}
            </button>
          </form>
        </div>
      </div>
    </main>
  `,
})
export class Login {
  protected readonly session = inject(SessionStore);
  protected readonly configError = supabaseConfigError;
  protected readonly email = signal('');
  protected readonly password = signal('');

  protected submit(): void {
    if (this.email().trim() && this.password()) void this.session.login(this.email().trim(), this.password());
  }
}
