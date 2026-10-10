import { DOCUMENT, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ResolvedTheme, Theme } from '@appTypes/theme.types';
import { IONIC_SHADES, THEME_DOM, THEME_LOG } from '@constants/theme.constants';
import { ionicPrimaryVars } from '@utils/ionic-colors/ionic-colors.util';
import { DEFAULT_THEME, contrast, fontsHref, resolveTheme, themeVars, validateTheme } from '@utils/theme/theme.util';

/**
 * Applies a restaurant theme: the CSS variables from templates/THEME.md on <html>, Ionic's primary
 * set, <meta name="theme-color">, the Google Fonts stylesheet and (native only) the status bar.
 * Uses Angular's DOCUMENT, so the first server-rendered HTML already has the right colours.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly current = signal<ResolvedTheme>(resolveTheme(DEFAULT_THEME));

  readonly theme = this.current.asReadonly();

  /**
   * Source of the restaurant theme.
   * TODO(Phase 8): load tenant theme from Supabase (owned by restaurant-app-0f)
   */
  getTheme(): Theme {
    return DEFAULT_THEME;
  }

  /** Validates like templates/theme.mjs (build.mjs); an invalid theme falls back to the default. */
  applyTheme(theme: Theme): ResolvedTheme {
    const errors = validateTheme(theme);
    if (errors.length) {
      console.warn(THEME_LOG.INVALID, errors);
      theme = DEFAULT_THEME;
    }
    const resolved = resolveTheme(theme);
    this.current.set(resolved);

    const vars = { ...themeVars(resolved), ...ionicPrimaryVars(resolved.colors.primary) };
    const root = this.doc.documentElement;
    // Inline style on <html>: beats the :root defaults and is serialised into the SSR HTML.
    const keep = (root.getAttribute(THEME_DOM.STYLE_ATTR) ?? '')
      .split(';')
      .map((d) => d.trim())
      .filter((d) => d && !THEME_DOM.OWNED_PREFIXES.some((p) => d.startsWith(p)));
    root.setAttribute(THEME_DOM.STYLE_ATTR, [...keep, ...Object.entries(vars).map(([k, v]) => `${k}: ${v}`)].join('; '));

    this.setMetaThemeColor(resolved.colors.primary);
    this.setFontsLink(fontsHref(resolved));
    void this.setStatusBar(resolved.colors.primary);
    return resolved;
  }

  private setMetaThemeColor(color: string): void {
    const head = this.doc.head;
    if (!head) return;
    let meta = head.querySelector(`meta[name="${THEME_DOM.META_THEME_COLOR}"]`);
    if (!meta) {
      meta = this.doc.createElement('meta');
      meta.setAttribute('name', THEME_DOM.META_THEME_COLOR);
      head.appendChild(meta);
    }
    meta.setAttribute('content', color);
  }

  private setFontsLink(href: string): void {
    const head = this.doc.head;
    if (!head) return;
    let link = head.querySelector(`link#${THEME_DOM.FONT_LINK_ID}`);
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('id', THEME_DOM.FONT_LINK_ID);
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
      await StatusBar.setStyle({ style: contrast(IONIC_SHADES.WHITE, color) >= IONIC_SHADES.STATUS_BAR_CONTRAST_MIN ? Style.Dark : Style.Light });
    } catch {
      // Not fatal (plugin unavailable on this platform).
    }
  }
}
