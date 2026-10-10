import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LayoutStore } from '@app/core/layout.store';
import { AuthStore } from '@app/core/auth.store';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly layout = inject(LayoutStore);
  protected readonly auth = inject(AuthStore);
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected signOut(): void {
    this.menuOpen.set(false);
    this.auth.logout();
  }
}
