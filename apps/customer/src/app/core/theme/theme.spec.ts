import { DEFAULT_THEME, fontsHref, resolveTheme, themeVars, validateTheme } from './theme';

// Values from templates/THEME.md (the shared spec).
describe('theme (mirror of templates/theme.mjs)', () => {
  it('resolves the default theme to the THEME.md defaults', () => {
    const t = resolveTheme({});
    expect(t.version).toBe(1);
    expect(t.logo).toBeNull();
    expect(t.colors).toEqual({
      primary: '#2f5d3a',
      primaryLight: '#3b7347',
      primarySoft: '#e3efe2',
      onDarkAccent: '#b9dcb6',
      dark: '#2b1d14',
      text: '#2b1d14',
      muted: '#6b5a4c',
      accent: '#8b5e3c',
      accentDark: '#5a3a26',
      background: '#fffaf2',
      surface: '#f7efe2',
      border: '#ecdfc9',
    });
    expect(t.fonts).toEqual({ heading: 'Fraunces', body: 'DM Sans', script: 'Caveat' });
    expect(resolveTheme(DEFAULT_THEME)).toEqual(t);
  });

  it('produces the CSS variable contract', () => {
    const vars = themeVars({});
    expect(vars['--color-primary']).toBe('#2f5d3a');
    expect(vars['--color-on-dark-accent']).toBe('#b9dcb6');
    expect(vars['--font-heading']).toBe('"Fraunces", Georgia, serif');
    expect(Object.keys(vars)).toHaveLength(15);
  });

  it('derives shades only for a custom primary, and text from dark', () => {
    const t = resolveTheme({ colors: { primary: '#000000', dark: '#111111' } });
    expect(t.colors.primaryLight).toBe('#2e2e2e'); // 82% black + white
    expect(t.colors.primarySoft).toBe('#dbdbdb'); // 14% black + white
    expect(t.colors.onDarkAccent).toBe('#a6a6a6'); // 35% black + white
    expect(t.colors.text).toBe('#111111');
  });

  it('validates hex colours, unknown keys and logos', () => {
    expect(validateTheme(DEFAULT_THEME)).toEqual([]);
    expect(validateTheme({ colors: { primary: 'red' } })[0]).toContain('6-digit hex');
    expect(validateTheme({ colors: { pink: '#ffffff' } })[0]).toContain('unknown colour');
    expect(validateTheme({ logo: 'https://cdn.example/logo.png' })).toEqual([]);
  });

  it('rejects an .svg logo', () => {
    const errors = validateTheme({ logo: 'https://cdn.example/logo.svg' });
    expect(errors).toEqual(['theme.logo: must be an https URL or a relative path ending in .png or .webp']);
  });

  it('builds the Google Fonts URL with only existing weights', () => {
    expect(fontsHref({})).toBe(
      'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@600&family=Caveat:wght@600&display=swap'
    );
    expect(fontsHref({ fonts: { body: 'Lato', heading: 'Yeseva One', script: 'Pacifico' } })).toBe(
      'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Yeseva+One&family=Pacifico&display=swap'
    );
  });
});
