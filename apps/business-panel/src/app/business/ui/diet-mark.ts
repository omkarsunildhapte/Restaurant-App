import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { DietType } from '../data/db';

export const DIET_LABEL: Record<DietType, string> = { veg: 'Veg', egg: 'Egg', non_veg: 'Non-veg' };

/** The Indian food mark: a square with a dot (veg green, egg yellow, non-veg brown). */
@Component({
  selector: 'bp-diet-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex shrink-0', role: 'img', '[attr.aria-label]': 'label()', '[attr.title]': 'label()' },
  template: `
    <span class="inline-flex h-4 w-4 items-center justify-center rounded-xs border-2" [class]="colors().border">
      <span class="h-2 w-2 rounded-full" [class]="colors().dot"></span>
    </span>
  `,
})
export class DietMark {
  readonly diet = input.required<DietType>();
  protected readonly label = computed(() => DIET_LABEL[this.diet()]);
  protected readonly colors = computed(() => {
    switch (this.diet()) {
      case 'veg':
        return { border: 'border-green-600', dot: 'bg-green-600' };
      case 'egg':
        return { border: 'border-yellow-500', dot: 'bg-yellow-500' };
      default:
        return { border: 'border-red-800', dot: 'bg-red-800' };
    }
  });
}

export function rupees(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const n = Number(value);
  return '₹' + (Number.isInteger(n) ? n.toLocaleString('en-IN') : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}
