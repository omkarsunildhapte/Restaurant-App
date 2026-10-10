/** ThemeService values (see templates/THEME.md). */
export const THEME_DOM = {
  FONT_LINK_ID: 'restaurant-theme-fonts',
  META_THEME_COLOR: 'theme-color',
  STYLE_ATTR: 'style',
  /** Inline-style prefixes ThemeService owns on <html>. */
  OWNED_PREFIXES: ['--color-', '--font-', '--ion-color-primary'],
} as const;

/** Ionic primary-set derivation (hex only, no color-mix). */
export const IONIC_SHADES = {
  WHITE: '#ffffff',
  BLACK: '#000000',
  SHADE_AMOUNT: 0.88,
  TINT_AMOUNT: 0.9,
  /** White text on primary needs at least this contrast, else black is used. */
  CONTRAST_MIN: 4.5,
  /** Status bar uses light text when white has at least this contrast. */
  STATUS_BAR_CONTRAST_MIN: 3,
} as const;

export const THEME_LOG = {
  INVALID: '[theme] invalid theme, using the default:',
} as const;
