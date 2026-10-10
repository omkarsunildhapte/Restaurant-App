import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '@app/core/auth.store';
import { LayoutStore } from '@app/core/layout.store';
import { NAV } from '@app/core/nav';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  /** The mobile drawer always shows labels, whatever the desktop rail is set to. */
  readonly forceExpanded = input(false);

  protected readonly layout = inject(LayoutStore);
  private readonly auth = inject(AuthStore);
  /** The Platform section only for Super Admins; the API refuses everyone else anyway. */
  protected readonly nav = computed(() => NAV.filter((s) => !s.superAdminOnly || this.auth.isSuperAdmin()));

  /**
   * Prefix matching keeps "Pipeline" lit on /leads/123, but would also light "Overview"
   * (/platform) on /platform/restaurants. So an item matches exactly only when another
   * menu item lives under its path.
   */
  private readonly allPaths = NAV.flatMap((s) => s.items.map((i) => i.path));
  protected exact(path: string): boolean {
    return this.allPaths.some((other) => other.startsWith(path + '/'));
  }
  protected readonly collapsed = computed(() => this.layout.collapsed() && !this.forceExpanded());
}
