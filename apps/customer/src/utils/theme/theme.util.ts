// Mirror of templates/theme.mjs; keep in sync (see templates/THEME.md).
// Only TypeScript types were added; the logic, defaults and regexes are identical, which is why
// its data (defaults, font weights, regexes) stays here instead of @constants (Rule 21 exception).

import { FontRole, ResolvedTheme, Theme, ThemeColors } from '@appTypes/theme.types';

/* Restaurant theme: the one shape shared by the website templates, the customer app and
   the database (see THEME.md). No dependencies; works in Node and in the browser.

     validateTheme(theme)  -> [] or ["theme.colors.primary: ..."]
     resolveTheme(theme)   -> every key filled in (defaults + derived shades), hex only
     themeVars(theme)      -> { "--color-primary": "#2f5d3a", ... "--font-heading": ... } for CSS
     fontsHref(theme)      -> Google Fonts stylesheet URL
*/

export const THEME_VERSION = 1;

/** Modern Café defaults. Every restaurant starts from these. */
export const DEFAULT_THEME: ResolvedTheme = {
  version: 1,
  logo: null,
  colors: {
    primary: "#2f5d3a",
    primaryLight: "#3b7347",
    primarySoft: "#e3efe2",
    onDarkAccent: "#b9dcb6",
    dark: "#2b1d14",
    text: "#2b1d14",
    muted: "#6b5a4c",
    accent: "#8b5e3c",
    accentDark: "#5a3a26",
    background: "#fffaf2",
    surface: "#f7efe2",
    border: "#ecdfc9",
  },
  fonts: { heading: "Fraunces", body: "DM Sans", script: "Caveat" },
};

/**
 * Fonts the theme editor offers (any Google Fonts family is still accepted), with the weights to load.
 * Only weights a font really has: Google rejects the whole stylesheet request otherwise.
 * "" = the font's single weight (400); browsers render the 600 headings from it.
 */
export const FONT_WEIGHTS: Record<FontRole, Record<string, string>> = {
  heading: {
    Fraunces: ":wght@600",
    "Playfair Display": ":wght@600",
    Lora: ":wght@600",
    "DM Serif Display": "",
    "Yeseva One": "",
    "Rozha One": "",
    Poppins: ":wght@600",
    Montserrat: ":wght@600",
  },
  body: {
    "DM Sans": ":wght@400;500;600;700",
    Inter: ":wght@400;500;600;700",
    Poppins: ":wght@400;500;600;700",
    Nunito: ":wght@400;500;600;700",
    Lato: ":wght@400;700",
    Mukta: ":wght@400;500;600;700",
    Hind: ":wght@400;500;600;700",
  },
  script: {
    Caveat: ":wght@600",
    Kalam: ":wght@700",
    "Dancing Script": ":wght@600",
    Pacifico: "",
  },
};
export const FONTS = Object.fromEntries(Object.entries(FONT_WEIGHTS).map(([role, list]) => [role, Object.keys(list)])) as Record<FontRole, string[]>;

const HEX = /^#[0-9a-f]{6}$/i;
const FONT_NAME = /^[A-Za-z0-9 ]{2,40}$/;
const LOGO = /^(https:\/\/[^\s"'<>]+|[a-z0-9_\-/]+)\.(png|webp)(\?[^\s"'<>]*)?$/i; // no SVG: it can carry script

// ---- Colour maths (sRGB) ----
const toRgb = (hex: string): number[] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb: number[]): string => "#" + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
/** amount of `a` mixed into `b`, like CSS color-mix(in srgb, a amount, b). */
export const mix = (a: string, b: string, amount: number): string => {
  const [x, y] = [toRgb(a), toRgb(b)];
  return toHex(x.map((v, i) => v * amount + y[i] * (1 - amount)));
};
const luminance = (hex: string): number => {
  const c = toRgb(hex).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const contrast = (a: string, b: string): number => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (l1 + 0.05) / (l2 + 0.05);
};

/** An unvalidated theme as read from storage/the API (validateTheme narrows it). */
interface ThemeInput {
  version?: unknown;
  logo?: unknown;
  colors?: Record<string, unknown>;
  fonts?: Record<string, unknown>;
}

/** Problems that must block saving. Empty array = valid. Missing keys are fine (defaults apply). */
export function validateTheme(input: unknown): string[] {
  const errors: string[] = [];
  if (input == null || typeof input !== "object") return ["theme must be an object"];
  const theme = input as ThemeInput;
  if (theme.version !== undefined && theme.version !== THEME_VERSION) errors.push(`theme.version: only ${THEME_VERSION} is supported`);
  for (const key of Object.keys(theme)) if (!["version", "logo", "colors", "fonts"].includes(key)) errors.push(`theme.${key}: unknown key`);

  if (theme.logo != null && !(typeof theme.logo === "string" && LOGO.test(theme.logo))) {
    errors.push("theme.logo: must be an https URL or a relative path ending in .png or .webp");
  }
  for (const [key, value] of Object.entries<unknown>(theme.colors || {})) {
    if (!(key in DEFAULT_THEME.colors)) errors.push(`theme.colors.${key}: unknown colour. Use: ${Object.keys(DEFAULT_THEME.colors).join(", ")}`);
    else if (typeof value !== "string" || !HEX.test(value)) errors.push(`theme.colors.${key}: "${value}" must be a 6-digit hex colour like #2f5d3a`);
  }
  for (const [key, value] of Object.entries<unknown>(theme.fonts || {})) {
    if (!FONTS[key as FontRole]) errors.push(`theme.fonts.${key}: unknown font role. Use: heading, body, script`);
    else if (typeof value !== "string" || !FONT_NAME.test(value)) errors.push(`theme.fonts.${key}: "${value}" is not a Google Fonts family name`);
  }
  return errors;
}

/** Readability problems: shown in the editor, don't block saving. Run on a valid theme. */
export function themeWarnings(theme: Theme): string[] {
  const c = resolveTheme(theme).colors;
  const out: string[] = [];
  if (contrast("#ffffff", c.primary) < 4.5) out.push("White text on the main colour is hard to read. Pick a darker main colour.");
  if (contrast(c.text, c.background) < 4.5) out.push("Text colour and background are too close. Pick a darker text or lighter background.");
  if (contrast(c.onDarkAccent, c.dark) < 3) out.push("Accent on dark sections is hard to see.");
  return out;
}

/**
 * Every key filled in, hex only (no color-mix, so old phone webviews get the same colours).
 * Shades not given are mixed from the colour they depend on. When the main colour is the
 * default, the hand-picked default shades are kept.
 */
export function resolveTheme(theme: Theme = {}): ResolvedTheme {
  const given: Partial<ThemeColors> = theme.colors || {};
  const d = DEFAULT_THEME.colors;
  const primary = given.primary || d.primary;
  const custom = primary.toLowerCase() !== d.primary;
  const dark = given.dark || d.dark;
  const colors: ThemeColors = {
    ...d,
    ...given,
    primary,
    primaryLight: given.primaryLight || (custom ? mix(primary, "#ffffff", 0.82) : d.primaryLight),
    primarySoft: given.primarySoft || (custom ? mix(primary, "#ffffff", 0.14) : d.primarySoft),
    onDarkAccent: given.onDarkAccent || (custom ? mix(primary, "#ffffff", 0.35) : d.onDarkAccent),
    dark,
    text: given.text || (given.dark ? dark : d.text),
  };
  return {
    version: THEME_VERSION,
    logo: theme.logo ?? null,
    colors,
    fonts: { ...DEFAULT_THEME.fonts, ...theme.fonts },
  };
}

const kebab = (s: string): string => s.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

/** CSS custom properties: --color-primary, --color-primary-light ... --font-heading, --font-body, --font-script. */
export function themeVars(theme: Theme): Record<string, string> {
  const t = resolveTheme(theme);
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(t.colors)) vars[`--color-${kebab(k)}`] = v;
  vars["--font-heading"] = `"${t.fonts.heading}", Georgia, serif`;
  vars["--font-body"] = `"${t.fonts.body}", system-ui, -apple-system, "Segoe UI", sans-serif`;
  vars["--font-script"] = `"${t.fonts.script}", cursive`;
  return vars;
}

export const themeCss = (theme: Theme, selector = ":root"): string =>
  `${selector}{${Object.entries(themeVars(theme)).map(([k, v]) => `${k}:${v}`).join(";")}}`;

export function fontsHref(theme: Theme): string {
  const f = resolveTheme(theme).fonts;
  const families: string[] = [];
  const seen = new Set<string>();
  // Body first: its weight list is the widest, so a font used twice keeps every weight.
  for (const role of ["body", "heading", "script"] as FontRole[]) {
    if (seen.has(f[role])) continue;
    seen.add(f[role]);
    // Unknown fonts load without a weight list: always a valid request, gives the 400 weight.
    const part = `family=${f[role].trim().replace(/ /g, "+")}${FONT_WEIGHTS[role][f[role]] ?? ""}`;
    families.push(part);
  }
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}
