import { DOCUMENT, Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Theme = 'light' | 'dark';

const THEME_KEY = 'rp-console.theme';
const COLLAPSED_KEY = 'rp-console.sidebar-collapsed';

/**
 * Shared chrome state: sidebar collapse, the mobile off-canvas drawer, and the
 * colour theme. Saved choices live in the browser's localStorage, which does not exist when
 * the page is rendered on the server (SSR): there the defaults are used, and the browser
 * applies the saved ones once it takes over. Reads are wrapped because private-mode
 * browsers throw on localStorage access rather than returning null.
 */
@Injectable({ providedIn: 'root' })
export class LayoutStore {
  private readonly document = inject(DOCUMENT);
  private readonly inBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _collapsed = signal(this.read(COLLAPSED_KEY) === 'true');
  private readonly _mobileOpen = signal(false);
  private readonly _theme = signal<Theme>(this.read(THEME_KEY) === 'dark' ? 'dark' : 'light');

  readonly collapsed = this._collapsed.asReadonly();
  readonly mobileOpen = this._mobileOpen.asReadonly();
  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    effect(() => {
      const dark = this._theme() === 'dark';
      this.document.documentElement.classList.toggle('dark', dark);
      this.write(THEME_KEY, dark ? 'dark' : 'light');
    });

    effect(() => this.write(COLLAPSED_KEY, String(this._collapsed())));
  }

  toggleSidebar(): void {
    this._collapsed.update((v) => !v);
  }

  openMobile(): void {
    this._mobileOpen.set(true);
  }

  closeMobile(): void {
    this._mobileOpen.set(false);
  }

  toggleTheme(): void {
    this._theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  private read(key: string): string | null {
    if (!this.inBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    if (!this.inBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable — the app still works, it just won't remember */
    }
  }
}
