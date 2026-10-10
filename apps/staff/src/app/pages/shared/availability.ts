import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuStore } from '@app/core/menu.store';
import { TPipe } from '@app/core/i18n';

/**
 * Sold-out switch for the counter and the kitchen: tap a dish to mark it sold out (waiters can
 * no longer add it) or back on. Sold-out dishes are listed first so the day's gaps are visible.
 */
@Component({
  selector: 'app-availability',
  imports: [FormsModule, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-40 grid place-items-end bg-ink-900/50 sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="avail-title">
      <div class="flex max-h-[85dvh] w-full flex-col rounded-t-2xl bg-white sm:max-w-lg sm:rounded-2xl">
        <div class="flex items-center gap-2 border-b border-ink-100 p-4">
          <h2 id="avail-title" class="flex-1 text-lg font-semibold text-ink-900">{{ 'avail.title' | t }}</h2>
          <button type="button" (click)="close.emit()" class="btn-secondary">{{ 'common.done' | t }}</button>
        </div>
        <div class="p-3">
          <input type="search" [ngModel]="query()" (ngModelChange)="query.set($event)" [placeholder]="'menu.search' | t" [attr.aria-label]="'menu.searchLabel' | t" class="field mt-0" />
          @if (soldOut()) { <p class="mt-2 text-sm text-rose-700">{{ soldOut() === 1 ? ('avail.countOne' | t) : ('avail.count' | t: { n: soldOut() }) }}</p> }
        </div>
        <ul class="min-h-0 flex-1 divide-y divide-ink-100 overflow-y-auto px-3 pb-3">
          @for (item of list(); track item.id) {
            <li class="flex items-center gap-3 py-2.5">
              <span class="diet" [class]="'diet-' + item.diet"></span>
              <span class="min-w-0 flex-1 truncate text-sm font-medium" [class]="item.is_available ? 'text-ink-900' : 'text-ink-400 line-through'">{{ item.name }}</span>
              <button type="button" (click)="menu.setAvailable(item.id, !item.is_available)"
                class="rounded-full px-3 py-1.5 text-xs font-semibold"
                [class]="item.is_available ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-100 text-rose-800'"
                [attr.aria-pressed]="!item.is_available">
                {{ (item.is_available ? 'avail.available' : 'avail.soldOut') | t }}
              </button>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class Availability {
  readonly close = output<void>();
  protected readonly menu = inject(MenuStore);
  protected readonly query = signal('');

  protected readonly list = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.menu
      .menu()
      .items.filter((i) => !q || i.name.toLowerCase().includes(q))
      .sort((a, b) => Number(a.is_available) - Number(b.is_available) || a.name.localeCompare(b.name));
  });
  protected readonly soldOut = computed(() => this.menu.menu().items.filter((i) => !i.is_available).length);
}
