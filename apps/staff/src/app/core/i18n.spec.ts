import { TestBed } from '@angular/core/testing';
import { I18n, LANGUAGES } from './i18n';
import { en } from './i18n/en';
import { hi } from './i18n/hi';
import { mr } from './i18n/mr';

// Node 25's own localStorage shadows jsdom's in tests (see outbox.spec.ts): use an in-memory one.
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

describe('I18n', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage(), configurable: true, writable: true });
  });

  it('starts in English and fills in placeholders', () => {
    const i18n = TestBed.inject(I18n);
    expect(i18n.lang()).toBe('en');
    expect(i18n.t('tables.seats', { n: 4 })).toBe('4 seats');
    expect(i18n.t('menu.pickFrom', { n: 1, group: 'Milk' })).toBe('Pick 1 from Milk');
  });

  it('switches language, remembers it on the device and sets <html lang>', () => {
    const i18n = TestBed.inject(I18n);
    i18n.setLang('mr');
    expect(i18n.t('tables.free')).toBe('रिकामे');
    expect(i18n.t('tables.seats', { n: 4 })).toBe('4 जागा');
    expect(localStorage.getItem('rp-staff.lang')).toBe('mr');
    expect(document.documentElement.lang).toBe('mr');
    i18n.setLang('hi');
    expect(i18n.t('kot.ready')).toBe('तैयार');
  });

  it('Hindi and Marathi have every key, keep every placeholder and are not left in English', () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    for (const table of [hi, mr]) {
      expect(Object.keys(table).sort()).toEqual(Object.keys(en).sort());
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        expect(placeholders(table[key]), key).toBe(placeholders(en[key]));
        expect(table[key].trim(), key).not.toBe('');
      }
    }
    expect(LANGUAGES.map((l) => l.id)).toEqual(['en', 'hi', 'mr']);
  });
});
