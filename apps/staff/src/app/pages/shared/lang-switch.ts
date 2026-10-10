import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n, LANGUAGES, TPipe } from '@app/core/i18n';

/** English / हिंदी / मराठी buttons; the choice is remembered on this device. */
@Component({
  selector: 'app-lang-switch',
  imports: [TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex gap-1" role="group" [attr.aria-label]="'lang.label' | t">
      @for (l of languages; track l.id) {
        <button type="button" (click)="i18n.setLang(l.id)" [attr.lang]="l.id" [attr.aria-pressed]="i18n.lang() === l.id"
          class="flex-1 rounded-md px-2 py-1 text-sm" [class]="i18n.lang() === l.id ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-700'">{{ l.label }}</button>
      }
    </div>
  `,
})
export class LangSwitch {
  protected readonly i18n = inject(I18n);
  protected readonly languages = LANGUAGES;
}
