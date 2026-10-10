import { DOCUMENT, Injectable, PLATFORM_ID, Pipe, type PipeTransform, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { en, type I18nKey } from '@app/core/i18n/en';
import { hi } from '@app/core/i18n/hi';
import { mr } from '@app/core/i18n/mr';

export type Lang = 'en' | 'hi' | 'mr';
export type { I18nKey };
type Params = Record<string, string | number>;

/** Each language in its own script, so a person who can't read English still finds theirs. */
export const LANGUAGES: readonly { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी' },
  { id: 'mr', label: 'मराठी' },
];

const TEXT: Record<Lang, Record<I18nKey, string>> = { en, hi, mr };
const KEY = 'rp-staff.lang';

/**
 * Staff app language (English, Hindi, Marathi), chosen per device and remembered there.
 * English until someone picks another; the server render is always English and the browser
 * switches on start-up. Templates use the `t` pipe, code calls `t()`.
 */
@Injectable({ providedIn: 'root' })
export class I18n {
  private readonly document = inject(DOCUMENT);
  private readonly inBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _lang = signal<Lang>(this.read());
  readonly lang = this._lang.asReadonly();

  constructor() {
    if (this.inBrowser) this.document.documentElement.lang = this._lang();
  }

  public setLang(lang: Lang): void {
    this._lang.set(lang);
    if (this.inBrowser) this.document.documentElement.lang = lang;
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* not remembered */
    }
  }

  /** Text for a key in the current language, with `{name}` placeholders filled in. */
  public t(key: I18nKey, params?: Params): string {
    // Unknown keys (e.g. a payout type added in the database later) show as themselves.
    const text: string = TEXT[this._lang()][key] ?? en[key] ?? key;
    return params ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m)) : text;
  }

  private read(): Lang {
    if (!this.inBrowser) return 'en';
    try {
      const saved = localStorage.getItem(KEY);
      return saved === 'hi' || saved === 'mr' ? saved : 'en';
    } catch {
      return 'en';
    }
  }
}

/**
 * `{{ 'tables.seats' | t: { n: 4 } }}`. Impure on purpose: a pure pipe caches per input and
 * would not re-run when the language changes; the lookup is a plain object read.
 */
@Pipe({ name: 't', pure: false })
export class TPipe implements PipeTransform {
  private readonly i18n = inject(I18n);

  public transform(key: I18nKey, params?: Params): string {
    return this.i18n.t(key, params);
  }
}
