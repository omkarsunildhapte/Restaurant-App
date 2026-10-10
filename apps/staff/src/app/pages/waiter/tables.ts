import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FloorStore } from '@app/core/floor.store';
import { money, minutesSince, type TableStatus } from '@app/core/models';
import { TPipe } from '@app/core/i18n';

/** The floor: every table with its state. Tap a free table to start an order, a busy one to open it. */
@Component({
  selector: 'app-tables',
  imports: [TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-3 sm:p-4">
      <div class="mb-3 flex flex-wrap items-center gap-3 text-xs text-ink-600">
        <span class="flex items-center gap-1.5"><span class="size-3 rounded bg-white ring-1 ring-ink-300"></span>{{ 'tables.free' | t }}</span>
        <span class="flex items-center gap-1.5"><span class="size-3 rounded bg-brand-600"></span>{{ 'tables.ordering' | t }}</span>
        <span class="flex items-center gap-1.5"><span class="size-3 rounded bg-amber-500"></span>{{ 'tables.billRequested' | t }}</span>
        @if (floor.error()) { <span class="text-rose-600">{{ floor.error() }}</span> }
      </div>
      @for (area of areas(); track area.name) {
        @if (areas().length > 1) { <h2 class="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-500">{{ area.name ?? ('tables.area' | t) }}</h2> }
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          @for (t of area.tables; track t.table_id) {
            <button type="button" (click)="open(t)" [disabled]="busy()"
              class="flex aspect-square flex-col items-center justify-center rounded-2xl p-2 text-center shadow-sm active:scale-[.97]"
              [class]="t.status === 'free' ? 'bg-white text-ink-800 ring-1 ring-ink-200' : t.status === 'bill_requested' ? 'bg-amber-500 text-white' : 'bg-brand-600 text-white'">
              <span class="text-xl font-bold">{{ t.name }}</span>
              @if (t.status === 'free') {
                <span class="text-xs text-ink-500">{{ 'tables.seats' | t: { n: t.seats } }}</span>
              } @else {
                <span class="text-xs font-medium">{{ money(t.total) }}</span>
                @if (t.opened_at) { <span class="text-[11px] opacity-80">{{ 'tables.minutes' | t: { n: minutes(t.opened_at) } }}</span> }
              }
            </button>
          }
        </div>
      } @empty {
        <p class="py-16 text-center text-sm text-ink-400">{{ (floor.loading() ? 'tables.loading' : 'tables.none') | t }}</p>
      }
    </div>
  `,
})
export class Tables {
  protected readonly floor = inject(FloorStore);
  private readonly router = inject(Router);
  protected readonly money = money;
  protected readonly busy = signal(false);

  protected readonly areas = computed(() => {
    // null = tables with no area (labelled "Tables" in the current language)
    const groups = new Map<string | null, TableStatus[]>();
    for (const t of this.floor.tables()) {
      const key = t.area;
      groups.set(key, [...(groups.get(key) ?? []), t]);
    }
    return [...groups].map(([name, tables]) => ({ name, tables }));
  });

  protected minutes(iso: string): number {
    return minutesSince(iso);
  }

  protected async open(t: TableStatus): Promise<void> {
    const existing = t.order_id ?? this.floor.openOrderForTable(t.table_id)?.id;
    if (existing) {
      void this.router.navigate(['/waiter', existing]);
      return;
    }
    this.busy.set(true);
    try {
      const order = await this.floor.createOrder('dine_in', { tableId: t.table_id });
      void this.router.navigate(['/waiter', order.id]);
    } finally {
      this.busy.set(false);
    }
  }
}
