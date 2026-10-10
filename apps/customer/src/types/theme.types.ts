/** Restaurant theme shapes (templates/THEME.md). */

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primarySoft: string;
  onDarkAccent: string;
  dark: string;
  text: string;
  muted: string;
  accent: string;
  accentDark: string;
  background: string;
  surface: string;
  border: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  script: string;
}

/** A theme as saved by the Business panel: every key optional. */
export interface Theme {
  version?: number;
  logo?: string | null;
  colors?: Partial<ThemeColors>;
  fonts?: Partial<ThemeFonts>;
}

/** Output of resolveTheme(): every key filled in, hex only. */
export interface ResolvedTheme {
  version: number;
  logo: string | null;
  colors: ThemeColors;
  fonts: ThemeFonts;
}

export type FontRole = keyof ThemeFonts;
