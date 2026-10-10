import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import type { TenantRole } from '../data/db';
import { ROLE_LABEL, WorkspaceStore } from '../data/workspace.store';

interface NavItem {
  label: string;
  path: string;
  roles: readonly TenantRole[] | 'all';
}

const NAV: readonly NavItem[] = [
  { label: 'Dashboard', path: '/business/dashboard', roles: ['admin', 'owner', 'manager'] },
  { label: 'Orders', path: '/business/orders', roles: ['admin', 'owner', 'manager'] },
  { label: 'Menu', path: '/business/menu', roles: 'all' },
  { label: 'Tables', path: '/business/tables', roles: 'all' },
  { label: 'Staff', path: '/business/staff', roles: ['admin', 'owner', 'manager'] },
  { label: 'Outlets', path: '/business/outlets', roles: ['admin', 'owner', 'manager'] },
  { label: 'Purchases', path: '/business/purchases', roles: ['admin', 'owner', 'manager'] },
  { label: 'Salaries', path: '/business/salaries', roles: ['admin', 'owner'] },
  { label: 'Plan & billing', path: '/business/billing', roles: ['admin', 'owner'] },
  { label: 'Settings', path: '/business/settings', roles: ['admin', 'owner'] },
];

/** Business panel frame: navigation for the person's role, business and outlet pickers. */
@Component({
  selector: 'bp-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessShell {
  protected readonly store = inject(WorkspaceStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly menuOpen = signal(false);
  protected readonly roleLabel = ROLE_LABEL;

  protected readonly nav = computed(() => {
    const role = this.store.role();
    return NAV.filter((n) => n.roles === 'all' || (role !== null && n.roles.includes(role)));
  });

  protected readonly email = computed(() => this.auth.user()?.email ?? '');

  protected readonly trialDaysLeft = computed(() => {
    const ws = this.store.current();
    if (ws?.status !== 'trial' || !ws.trial_ends_at) return null;
    return Math.ceil((new Date(ws.trial_ends_at).getTime() - Date.now()) / 86_400_000);
  });

  protected async switchTenant(id: string): Promise<void> {
    await this.store.selectTenant(id);
    // Reload the current screen for the new business.
    const url = this.router.url;
    await this.router.navigateByUrl('/business', { skipLocationChange: true });
    await this.router.navigateByUrl(url);
  }

  protected async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
    } finally {
      this.store.clear();
      await this.router.navigateByUrl('/login');
    }
  }
}
