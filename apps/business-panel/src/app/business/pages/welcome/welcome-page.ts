import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { BusinessDb, errorText, unwrap } from '../../data/db';
import { WorkspaceStore } from '../../data/workspace.store';

/**
 * Where invite emails land. Supabase signs the person in from the link; they choose a password
 * (and confirm their name) here, then go to their business.
 */
@Component({
  selector: 'bp-welcome-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen items-center justify-center bg-brand-cream p-4">
      <div class="w-full max-w-md rounded-md bg-white p-6 shadow-xs">
        <img src="brand/thaliyo-logo-600.webp" alt="Thaliyo" width="600" height="465" class="mx-auto mb-5 h-auto w-36" />
        @if (state() === 'checking') {
          <p class="text-center text-sm text-gray-500">Opening your invitation…</p>
        } @else if (state() === 'no-session') {
          <h1 class="text-xl font-semibold text-gray-900">This link has expired</h1>
          <p class="mt-2 text-sm text-gray-600">
            Invitation links work once and for a limited time. Ask the person who invited you to send it again,
            or sign in if you already set a password.
          </p>
          <a routerLink="/login" class="btn btn-primary mt-4 w-full py-2 text-sm">Go to sign in</a>
        } @else {
          <h1 class="text-xl font-semibold text-brand-brown">Welcome to Thaliyo{{ firstName() ? ', ' + firstName() : '' }}</h1>
          <p class="mt-1 text-sm text-gray-600">Choose a password for {{ email() }}. You'll use it to sign in from now on.</p>
          <form class="mt-5 grid gap-4" (ngSubmit)="save()">
            <label class="block text-sm font-medium text-gray-700">
              Your name
              <input class="form-input mt-1 py-2" name="name" autocomplete="name" [(ngModel)]="fullName" />
            </label>
            <label class="block text-sm font-medium text-gray-700">
              Password
              <input class="form-input mt-1 py-2" type="password" name="password" autocomplete="new-password" minlength="8" required [(ngModel)]="password" />
              <span class="mt-1 block text-xs font-normal text-gray-500">At least 8 characters.</span>
            </label>
            <label class="block text-sm font-medium text-gray-700">
              Password again
              <input class="form-input mt-1 py-2" type="password" name="password2" autocomplete="new-password" required [(ngModel)]="password2" />
            </label>
            @if (error()) {
              <p class="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{{ error() }}</p>
            }
            <button type="submit" class="btn btn-primary py-2 text-sm" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Save and continue' }}</button>
          </form>
        }
      </div>
    </div>
  `,
})
export class WelcomePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly db = inject(BusinessDb);
  private readonly store = inject(WorkspaceStore);
  private readonly router = inject(Router);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly state = signal<'checking' | 'no-session' | 'ready'>('checking');
  protected readonly fullName = signal('');
  protected readonly password = signal('');
  protected readonly password2 = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly email = computed(() => this.auth.user()?.email ?? '');
  protected readonly firstName = computed(() => this.fullName().trim().split(/\s+/)[0] ?? '');

  public async ngOnInit(): Promise<void> {
    if (!this.browser) return;
    await this.auth.ready;
    // The session from the link's #access_token can arrive just after the stored one is restored.
    for (let i = 0; i < 10 && !this.auth.isSignedIn(); i++) await new Promise((r) => setTimeout(r, 200));
    const user = this.auth.user();
    if (!user) {
      this.state.set('no-session');
      return;
    }
    this.fullName.set((user.user_metadata?.['full_name'] as string | undefined) ?? '');
    this.state.set('ready');
  }

  protected async save(): Promise<void> {
    if (this.password().length < 8) {
      this.error.set('Use at least 8 characters.');
      return;
    }
    if (this.password() !== this.password2()) {
      this.error.set('The two passwords are different.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      const name = this.fullName().trim();
      const { error } = await this.db.client.auth.updateUser({ password: this.password(), data: name ? { full_name: name } : undefined });
      if (error) throw error;
      const userId = this.auth.user()?.id;
      if (name && userId) unwrap(await this.db.client.from('profiles').update({ full_name: name }).eq('id', userId));
      // Self sign-up: the business is created now that the email is confirmed (no-op for staff invites).
      const signup = unwrap(await this.db.client.rpc('complete_signup'));
      await this.store.reload();
      if (signup) await this.store.selectTenant((signup as { tenant_id: string }).tenant_id);
      const ws = this.store.current();
      const ownerOfNewBusiness = ws && (ws.role === 'owner' || ws.role === 'admin');
      await this.router.navigateByUrl(ownerOfNewBusiness ? '/business/setup' : '/business/menu');
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }
}
