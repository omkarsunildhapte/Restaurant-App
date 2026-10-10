import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from '@services/theme/theme.service';
import { DEFAULT_THEME } from '@utils/theme/theme.util';

vi.mock('@capacitor/status-bar', () => ({ StatusBar: { setBackgroundColor: vi.fn(), setStyle: vi.fn() }, Style: { Dark: 'DARK', Light: 'LIGHT' } }));

describe('ThemeService', () => {
  let service: ThemeService;
  let doc: Document;

  beforeEach(() => {
    service = TestBed.inject(ThemeService);
    doc = TestBed.inject(DOCUMENT);
  });

  it('sets the theme variables, meta theme-color and fonts link', () => {
    service.applyTheme({ colors: { primary: '#123456' } });
    const style = doc.documentElement.getAttribute('style') ?? '';
    expect(style).toContain('--color-primary: #123456');
    expect(style).toContain('--ion-color-primary: #123456');
    expect(doc.head.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#123456');
    expect(doc.head.querySelector('link#restaurant-theme-fonts')?.getAttribute('href')).toContain('fonts.googleapis.com');
    expect(service.theme().colors.primary).toBe('#123456');
  });

  it('falls back to the default theme when invalid', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(service.applyTheme({ colors: { primary: 'nope' } }).colors.primary).toBe('#2f5d3a');
    expect(warn).toHaveBeenCalled();
  });

  it('serves the default theme until tenant themes are wired', () => {
    expect(service.getTheme()).toBe(DEFAULT_THEME);
  });
});
