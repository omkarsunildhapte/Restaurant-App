import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/core';
import { ThemeService, ionicPrimaryVars } from './theme.service';

vi.mock('@capacitor/status-bar', () => ({
  StatusBar: { setBackgroundColor: vi.fn(), setStyle: vi.fn() },
  Style: { Dark: 'DARK', Light: 'LIGHT' },
}));

describe('ThemeService', () => {
  let service: ThemeService;
  let doc: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
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
  });

  it('falls back to the default theme when invalid', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const t = service.applyTheme({ colors: { primary: 'nope' } });
    expect(t.colors.primary).toBe('#2f5d3a');
    expect(warn).toHaveBeenCalled();
  });

  it('computes the Ionic primary set as hex/rgb', () => {
    expect(ionicPrimaryVars('#2f5d3a')).toEqual({
      '--ion-color-primary': '#2f5d3a',
      '--ion-color-primary-rgb': '47, 93, 58',
      '--ion-color-primary-contrast': '#ffffff',
      '--ion-color-primary-contrast-rgb': '255, 255, 255',
      '--ion-color-primary-shade': '#295233',
      '--ion-color-primary-tint': '#446d4e',
    });
  });
});
