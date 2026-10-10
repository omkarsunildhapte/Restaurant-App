import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from './icon.component';

let nextId = 0;

/**
 * Checkbox dropdown multi-select, usable with formControlName / ngModel.
 * The value is an array of the selected option objects (or of `optionValue`
 * fields when given). Options are matched by `dataKey` (default `id`) when
 * present, otherwise by deep (JSON) equality, so values loaded from the
 * database are recognised as selected.
 */
@Component({
    selector: 'ui-multi-select',
    imports: [IconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MultiSelectComponent), multi: true },
    ],
    host: {
        class: 'relative block w-full',
        '(document:mousedown)': 'onDocumentClick($event)',
        '(keydown.escape)': 'onEscape($event)',
    },
    template: `
    <button
      type="button"
      class="form-input flex items-center justify-between gap-2 text-left"
      [class.text-gray-400]="!selected().length"
      [disabled]="disabled()"
      [attr.id]="inputId()"
      aria-haspopup="listbox"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="panelId"
      (click)="toggle()"
    >
      <span class="truncate">{{ display() || placeholder() }}</span>
      <ui-icon name="chevron-down" size="h-4 w-4" class="text-gray-500" />
    </button>

    @if (open()) {
      <div
        [id]="panelId"
        class="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-gray-200 bg-white shadow-lg"
      >
        <div class="flex items-center gap-2 border-b border-gray-200 p-3">
          <input
            type="checkbox"
            class="h-5 w-5 rounded-sm border-gray-300 accent-brand-saffron"
            aria-label="Select all"
            [checked]="allSelected()"
            (change)="toggleAll()"
          />
          <input
            type="text"
            class="form-input py-2"
            placeholder="Search"
            aria-label="Filter options"
            [value]="filter()"
            (input)="filter.set($any($event.target).value)"
          />
        </div>
        <ul role="listbox" aria-multiselectable="true" class="max-h-60 overflow-y-auto py-1">
          @for (option of filtered(); track $index) {
            <li role="option" [attr.aria-selected]="isSelected(option)">
              <label class="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-gray-100">
                <input
                  type="checkbox"
                  class="h-5 w-5 rounded-sm border-gray-300 accent-brand-saffron"
                  [checked]="isSelected(option)"
                  (change)="toggleOption(option)"
                />
                <span>{{ labelOf(option) }}</span>
              </label>
            </li>
          } @empty {
            <li class="px-4 py-2 text-gray-500">No results found</li>
          }
        </ul>
      </div>
    }
  `
})
export class MultiSelectComponent implements ControlValueAccessor {
  readonly options = input<any[]>([]);
  readonly optionLabel = input('label');
  /** When set, the control value holds `option[optionValue]` instead of the whole option. */
  readonly optionValue = input<string | null>(null);
  readonly dataKey = input('id');
  readonly placeholder = input('');
  readonly inputId = input<string | null>(null);

  protected readonly panelId = `ui-multi-select-${nextId++}`;
  protected readonly open = signal(false);
  protected readonly disabled = signal(false);
  protected readonly filter = signal('');
  protected readonly selected = signal<any[]>([]);

  protected readonly filtered = computed(() => {
    const term = this.filter().trim().toLowerCase();
    const opts = this.options() ?? [];
    return term ? opts.filter((o) => String(this.labelOf(o)).toLowerCase().includes(term)) : opts;
  });
  protected readonly allSelected = computed(
    () => this.filtered().length > 0 && this.filtered().every((o) => this.isSelected(o)),
  );
  protected readonly display = computed(() =>
    this.selected()
      .map((v) => {
        const match = (this.options() ?? []).find((o) => this.matches(this.valueOf(o), v));
        return match ? this.labelOf(match) : this.optionValue() ? v : this.labelOf(v);
      })
      .join(', '),
  );

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private onChange: (value: any[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.selected.set(Array.isArray(value) ? [...value] : []);
  }
  registerOnChange(fn: (value: any[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (isDisabled) this.open.set(false);
  }

  protected labelOf(option: any): string {
    return option && typeof option === 'object' ? option[this.optionLabel()] : option;
  }

  protected isSelected(option: any): boolean {
    const value = this.valueOf(option);
    return this.selected().some((v) => this.matches(v, value));
  }

  protected toggle(): void {
    if (this.open()) this.close();
    else {
      this.filter.set('');
      this.open.set(true);
    }
  }

  protected toggleOption(option: any): void {
    const value = this.valueOf(option);
    const next = this.isSelected(option)
      ? this.selected().filter((v) => !this.matches(v, value))
      : [...this.selected(), value];
    this.commit(next);
  }

  protected toggleAll(): void {
    const visible = this.filtered().map((o) => this.valueOf(o));
    const rest = this.selected().filter((v) => !visible.some((o) => this.matches(o, v)));
    this.commit(this.allSelected() ? rest : [...rest, ...visible]);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  protected onEscape(event: Event): void {
    if (!this.open()) return;
    event.stopPropagation(); // don't also close a surrounding modal
    this.close();
    this.host.nativeElement.querySelector('button')?.focus();
  }

  private close(): void {
    this.open.set(false);
    this.onTouched();
  }

  private commit(next: any[]): void {
    this.selected.set(next);
    this.onChange(next);
  }

  private valueOf(option: any): any {
    const key = this.optionValue();
    return key && option && typeof option === 'object' ? option[key] : option;
  }

  private matches(a: any, b: any): boolean {
    if (a === b) return true;
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      const key = this.dataKey();
      if (key && a[key] !== undefined && b[key] !== undefined) return a[key] === b[key];
      return JSON.stringify(a) === JSON.stringify(b);
    }
    return false;
  }
}
