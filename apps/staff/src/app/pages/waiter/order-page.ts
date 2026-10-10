import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FloorStore, type NewItem } from '@app/core/floor.store';
import { MenuStore } from '@app/core/menu.store';
import { money } from '@app/core/models';
import { MenuPicker } from '@app/pages/shared/menu-picker';
import { Ticket } from '@app/pages/shared/ticket';

/**
 * Taking a table's order on a phone: the menu fills the screen, the ticket slides up from the
 * bottom bar. "Send to kitchen" sends all new items as the next KOT round.
 */
@Component({
  selector: 'app-order-page',
  imports: [RouterLink, MenuPicker, Ticket],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (order(); as o) {
      <div class="flex h-full flex-col lg:flex-row">
        <div class="min-h-0 flex-1">
          <app-menu-picker (add)="add($event)" />
        </div>

        <aside class="flex shrink-0 flex-col border-t border-ink-200 bg-white lg:w-96 lg:border-l lg:border-t-0" [class.max-lg:h-[70dvh]]="showTicket()">
          <button type="button" (click)="showTicket.set(!showTicket())" class="flex items-center justify-between px-3 py-2 lg:pointer-events-none">
            <span class="text-left">
              <span class="block text-sm font-semibold text-ink-900">
                <a routerLink="/waiter" class="mr-1 text-brand-600 lg:pointer-events-auto" aria-label="Back to tables">←</a>
                Table {{ tableName() }} @if (o.order_no) { · #{{ o.order_no }} }
              </span>
              <span class="block text-xs text-ink-500">{{ newCount() }} new · total {{ money(o.total) }}</span>
            </span>
            <span class="text-xs text-ink-500 lg:hidden">{{ showTicket() ? 'Hide ▾' : 'Show order ▴' }}</span>
          </button>
          <div class="min-h-0 flex-1 overflow-y-auto border-t border-ink-100" [class.max-lg:hidden]="!showTicket()">
            <app-ticket [orderId]="o.id" />
          </div>
          @if (error()) { <p class="px-3 pb-1 text-sm text-rose-600" role="alert">{{ error() }}</p> }
          <div class="grid grid-cols-2 gap-2 border-t border-ink-100 p-2">
            <button type="button" (click)="requestBill()" [disabled]="!!o.bill_requested_at || !floor.itemsOf(o.id).length" class="btn-secondary py-3">
              {{ o.bill_requested_at ? 'Bill requested' : 'Ask for bill' }}
            </button>
            <button type="button" (click)="send()" [disabled]="!newCount() || sending()" class="btn-primary py-3">
              {{ sending() ? 'Sending…' : 'Send to kitchen' + (newCount() ? ' (' + newCount() + ')' : '') }}
            </button>
          </div>
        </aside>
      </div>
    } @else {
      <div class="p-6 text-center">
        <p class="text-sm text-ink-500">{{ floor.loading() ? 'Loading order…' : 'This order is closed or no longer open.' }}</p>
        <a routerLink="/waiter" class="mt-3 inline-block text-sm font-medium text-brand-600">Back to tables</a>
      </div>
    }
  `,
})
export class OrderPage implements OnInit {
  readonly orderId = input.required<string>();

  protected readonly floor = inject(FloorStore);
  private readonly menu = inject(MenuStore);

  /** Fresh menu each time a table is opened, so dishes marked sold out elsewhere show as such. */
  public ngOnInit(): void {
    void this.menu.load();
  }
  protected readonly money = money;
  protected readonly showTicket = signal(false);
  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly order = computed(() => this.floor.order(this.orderId()));
  protected readonly tableName = computed(() => this.floor.tableName(this.order()?.table_id ?? null) ?? '');
  protected readonly newCount = computed(() => this.floor.itemsOf(this.orderId()).filter((i) => !i.kot_id).reduce((s, i) => s + i.quantity, 0));

  protected async add(item: NewItem): Promise<void> {
    await this.run(() => this.floor.addItem(this.orderId(), item));
  }

  protected async send(): Promise<void> {
    this.sending.set(true);
    await this.run(() => this.floor.sendKot(this.orderId()));
    this.sending.set(false);
    this.showTicket.set(false);
  }

  protected async requestBill(): Promise<void> {
    await this.run(() => this.floor.requestBill(this.orderId()));
  }

  private async run(fn: () => Promise<void>): Promise<void> {
    this.error.set(null);
    try {
      await fn();
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }
}
