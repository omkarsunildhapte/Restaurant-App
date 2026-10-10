import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { WorkspaceStore } from '../../data/workspace.store';

/** Signed in, but not part of any open business (never invited, removed, or business suspended). */
@Component({
  selector: 'bp-no-access-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen items-center justify-center bg-brand-cream p-4">
      <div class="w-full max-w-md rounded-md bg-white p-6 text-center shadow-xs">
        <img src="brand/thaliyo-logo-600.webp" alt="Thaliyo" width="600" height="465" class="mx-auto mb-5 h-auto w-36" />
        <h1 class="text-xl font-semibold text-gray-900">No business to open</h1>
        <p class="mt-2 text-sm text-gray-600">
          {{ email() || 'This account' }} isn't part of an active restaurant yet. Ask the owner to invite you,
          or contact us if your restaurant's account has been paused.
        </p>
        <button type="button" class="btn btn-primary mt-5 w-full py-2 text-sm" (click)="signOut()">Sign in with another account</button>
      </div>
    </div>
  `,
})
export class NoAccessPage {
  private readonly auth = inject(AuthService);
  private readonly store = inject(WorkspaceStore);
  private readonly router = inject(Router);
  protected readonly email = computed(() => this.auth.user()?.email ?? '');

  protected async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
    } finally {
      this.store.clear();
      await this.router.navigateByUrl('/login');
    }
  }
}
