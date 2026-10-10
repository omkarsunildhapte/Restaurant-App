import { DOCUMENT, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { DEFAULT_THEME, ResolvedTheme, Theme, contrast, fontsHref, mix, resolveTheme, themeVars, validateTheme } from './theme';

/**
 * Source of the restaurant theme.
 * TODO(Phase 8): load tenant theme from Supabase (owned by restaurant-app-0f)
 * (planned: RPC get_theme(p_slug) / GET /public/v1/restaurants/:slug/theme, see templates/THEME.md).
 */
export function getTheme(): Theme {
  return DEFAULT_THEME;
}

const FONT_LINK_ID = 'restaurant-theme-fonts';

/**
 * Applies a restaurant theme: the CSS variables from templates/THEME.md on <html>, the Ionic
 * primary colour set, <meta name="theme-color">, the Google Fonts stylesheet and (native only)
 * the status bar colour. Uses Angular's DOCUMENT, so it also runs during SSR and the first
 * server-rendered HTML already carries the right colours.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private current: ResolvedTheme = resolveTheme(DEFAULT_THEME);

  get theme(): ResolvedTheme {
    return this.current;
  }

  /** Validates like templates/theme.mjs (build.mjs); an invalid theme falls back to the default. */
  applyTheme(theme: Theme): ResolvedTheme {
    const errors = validateTheme(theme);
    if (errors.length) {
      console.warn('[theme] invalid theme, using the default:', errors);
      theme = DEFAULT_THEME;
    }
    const resolved = resolveTheme(theme);
    this.current = resolved;

    const vars = { ...themeVars(resolved), ...ionicPrimaryVars(resolved.colors.primary) };
    const root = this.doc.documentElement;
    // Inline style on <html>: beats the :root defaults and is serialised into the SSR HTML.
    const keep = (root.getAttribute('style') ?? '')
      .split(';')
      .map((d) => d.trim())
      .filter((d) => d && !d.startsWith('--color-') && !d.startsWith('--font-') && !d.startsWith('--ion-color-primary'));
    root.setAttribute('style', [...keep, ...Object.entries(vars).map(([k, v]) => `${k}: ${v}`)].join('; '));

    this.setMetaThemeColor(resolved.colors.primary);
    this.setFontsLink(fontsHref(resolved));
    void this.setStatusBar(resolved.colors.primary);
    return resolved;
  }

  private setMetaThemeColor(color: string): void {
    const head = this.doc.head;
    if (!head) return;
    let meta = head.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = this.doc.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      head.appendChild(meta);
    }
    meta.setAttribute('content', color);
  }

  private setFontsLink(href: string): void {
    const head = this.doc.head;
    if (!head) return;
    let link = head.querySelector(`link#${FONT_LINK_ID}`);
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('id', FONT_LINK_ID);
      link.setAttribute('rel', 'stylesheet');
      head.appendChild(link);
    }
    if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  }

  private async setStatusBar(color: string): Promise<void> {
    if (!this.isBrowser || !Capacitor.isNativePlatform()) return;
    try {
      await StatusBar.setBackgroundColor({ color });
      // Style.Dark = light text, for dark backgrounds.
      await StatusBar.setStyle({ style: contrast('#ffffff', color) >= 3 ? Style.Dark : Style.Light });
    } catch {
      // Not fatal (e.g. plugin unavailable on this platform).
    }
  }
}

/** Ionic's primary colour set for a hex primary (hex/rgb only, no color-mix). */
export function ionicPrimaryVars(primary: string): Record<string, string> {
  const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ');
  const contrastColor = contrast('#ffffff', primary) >= 4.5 ? '#ffffff' : '#000000';
  return {
    '--ion-color-primary': primary,
    '--ion-color-primary-rgb': rgb(primary),
    '--ion-color-primary-contrast': contrastColor,
    '--ion-color-primary-contrast-rgb': rgb(contrastColor),
    '--ion-color-primary-shade': mix(primary, '#000000', 0.88),
    '--ion-color-primary-tint': mix(primary, '#ffffff', 0.9),
  };
}
