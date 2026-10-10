import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FloorStore } from '@app/core/floor.store';
import { money, type KotStatus, type OrderItem } from '@app/core/models';
import { TPipe, type I18nKey } from '@app/core/i18n';

const KOT_LABEL: Record<KotStatus, I18nKey> = { new: 'kot.new', preparing: 'kot.preparing', ready: 'kot.ready', served: 'kot.served', cancelled: 'kot.cancelled' };
const KOT_CLASS: Record<KotStatus, string> = {
  new: 'bg-amber-100 text-amber-800',
  preparing: 'bg-brand-100 text-brand-800',
  ready: 'bg-emerald-100 text-emerald-800',
  served: 'bg-ink-100 text-ink-600',
  cancelled: 'bg-rose-100 text-rose-700',
};

/**
 * The order so far: rounds already in the kitchen (read-only here, with their status) and the
 * new items not yet sent, whose quantities can still change. Items paid on a split bill are marked.
 */
@Component({
  selector: 'app-ticket',
  imports: [TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (k of rounds(); track k.kot.id) {
      <section class="border-b border-ink-100 px-3 py-2">
        <p class="flex items-center justify-between text-xs font-semibold uppercase text-ink-500">
          {{ 'ticket.round' | t: { n: k.kot.round_no } }}
          <span class="rounded-full px-2 py-0.5 normal-case" [class]="kotClass[k.kot.status]">{{ kotLabel[k.kot.status] | t }}</span>
        </p>
        @for (i of k.items; track i.id) {
          <p class="mt-1 flex justify-between gap-2 text-sm text-ink-700">
            <span>{{ i.quantity }} × {{ label(i) }}@if (i.bill_id) { <span class="ml-1 rounded bg-emerald-100 px-1.5 text-xs text-emerald-800">{{ 'ticket.paid' | t }}</span> }</span><span class="tabular-nums">{{ money(i.line_total) }}</span>
          </p>
        }
      </section>
    }
    <section class="px-3 py-2">
      @if (rounds().length) {
        <p class="text-xs font-semibold uppercase text-ink-500">{{ 'ticket.new' | t }}</p>
      }
      @for (i of unsent(); track i.id) {
        <div class="mt-1.5 flex items-center gap-2">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-ink-900">{{ label(i) }}</p>
            @if (i.notes) { <p class="truncate text-xs text-amber-700">{{ i.notes }}</p> }
          </div>
          @if (i.bill_id) {
            <span class="text-sm text-ink-700">{{ i.quantity }} ×</span>
            <span class="rounded bg-emerald-100 px-1.5 text-xs text-emerald-800">{{ 'ticket.paid' | t }}</span>
          } @else {
            <div class="flex items-center rounded-lg border border-ink-200">
              <button type="button" (click)="floor.setQuantity(i, i.quantity - 1)" class="px-2.5 py-1 text-base" [attr.aria-label]="'ticket.less' | t: { name: i.name }">−</button>
              <span class="w-6 text-center text-sm font-semibold">{{ i.quantity }}</span>
              <button type="button" (click)="floor.setQuantity(i, i.quantity + 1)" class="px-2.5 py-1 text-base" [attr.aria-label]="'ticket.more' | t: { name: i.name }">+</button>
            </div>
          }
          <span class="w-16 text-right text-sm tabular-nums text-ink-700">{{ money(i.line_total) }}</span>
        </div>
      } @empty {
        @if (!rounds().length) { <p class="py-6 text-center text-sm text-ink-400">{{ 'ticket.empty' | t }}</p> }
      }
    </section>
  `,
})
export class Ticket {
  readonly orderId = input.required<string>();

  protected readonly floor = inject(FloorStore);
  protected readonly money = money;
  protected readonly kotLabel = KOT_LABEL;
  protected readonly kotClass = KOT_CLASS;

  protected readonly unsent = computed(() => this.floor.itemsOf(this.orderId()).filter((i) => !i.kot_id));
  protected readonly rounds = computed(() => {
    const items = this.floor.itemsOf(this.orderId());
    return this.floor.kotsOf(this.orderId()).map((kot) => ({ kot, items: items.filter((i) => i.kot_id === kot.id) }));
  });

  protected label(i: OrderItem): string {
    return i.name + (i.variant_name ? ` (${i.variant_name})` : '') + (i.addons.length ? ' + ' + i.addons.map((a) => a.name).join(', ') : '');
  }
}
