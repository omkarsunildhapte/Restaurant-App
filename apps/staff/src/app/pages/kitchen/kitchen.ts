import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FloorStore } from '@app/core/floor.store';
import { Printer } from '@app/core/printer';
import { Availability } from '@app/pages/shared/availability';
import { minutesSince, type Kot, type KotStatus, type OrderItem } from '@app/core/models';

interface Card {
  kot: Kot;
  where: string;
  orderNo: number | null;
  items: OrderItem[];
}

const COLUMNS: { status: KotStatus; title: string; next: KotStatus; action: string }[] = [
  { status: 'new', title: 'New', next: 'preparing', action: 'Start' },
  { status: 'preparing', title: 'Preparing', next: 'ready', action: 'Ready' },
  { status: 'ready', title: 'Ready to serve', next: 'served', action: 'Served' },
];

/**
 * Kitchen display (KDS) for a tablet or TV: every KOT round in the order it came in, moved
 * forward with one tap. New KOTs ring (after "Sound on" is tapped once: browsers only play sound
 * after a tap on the page).
 */
@Component({
  selector: 'app-kitchen',
  imports: [Availability],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col">
      <div class="flex items-center gap-3 border-b border-ink-200 bg-white px-3 py-2">
        <p class="text-sm text-ink-600">{{ cards().length }} active ticket{{ cards().length === 1 ? '' : 's' }}</p>
        @if (floor.error()) { <p class="text-sm text-rose-600">{{ floor.error() }}</p> }
        <button type="button" (click)="soldOutOpen.set(true)" class="ml-auto rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700">Sold out</button>
        <button type="button" (click)="toggleSound()" class="rounded-lg px-3 py-1.5 text-sm font-medium" [class]="sound() ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">
          {{ sound() ? '🔔 Sound on' : '🔕 Tap for sound' }}
        </button>
      </div>
      <div class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 md:grid-cols-3">
        @for (col of columns; track col.status) {
          <section class="flex min-h-0 flex-col rounded-2xl bg-ink-100/70 p-2" [attr.aria-label]="col.title">
            <h2 class="flex items-center justify-between px-1 pb-2 text-sm font-bold uppercase tracking-wide text-ink-600">
              {{ col.title }} <span class="rounded-full bg-white px-2 text-xs">{{ byStatus()[col.status].length }}</span>
            </h2>
            <div class="flex flex-col gap-2">
              @for (c of byStatus()[col.status]; track c.kot.id) {
                <article class="rounded-xl bg-white p-3 shadow-sm ring-2" [class]="ringClass(c.kot)">
                  <header class="flex items-baseline justify-between gap-2">
                    <p class="text-lg font-bold text-ink-900">{{ c.where }}</p>
                    <p class="text-sm font-semibold tabular-nums" [class]="ageClass(c.kot)">{{ age(c.kot) }} min</p>
                  </header>
                  <p class="text-xs text-ink-500">#{{ c.orderNo ?? '—' }} · round {{ c.kot.round_no }}</p>
                  <ul class="mt-2 space-y-1">
                    @for (i of c.items; track i.id) {
                      <li class="text-base leading-snug text-ink-900">
                        <b>{{ i.quantity }} ×</b> {{ i.name }}{{ i.variant_name ? ' (' + i.variant_name + ')' : '' }}
                        @if (i.addons.length) { <span class="block text-sm text-ink-600">+ {{ addonNames(i) }}</span> }
                        @if (i.notes) { <span class="block text-sm font-semibold text-amber-700">⚠ {{ i.notes }}</span> }
                      </li>
                    }
                  </ul>
                  <div class="mt-3 flex gap-2">
                    <button type="button" (click)="floor.moveKot(c.kot, col.next)" class="btn-primary flex-1 py-3 text-base">{{ col.action }}</button>
                    <button type="button" (click)="print(c)" class="btn-secondary px-3 text-sm">Print</button>
                  </div>
                </article>
              } @empty {
                <p class="py-8 text-center text-sm text-ink-400">Nothing here</p>
              }
            </div>
          </section>
        }
      </div>
    </div>
    @if (soldOutOpen()) { <app-availability (close)="soldOutOpen.set(false)" /> }
  `,
})
export class Kitchen implements OnInit, OnDestroy {
  protected readonly floor = inject(FloorStore);
  private readonly printer = inject(Printer);
  protected readonly columns = COLUMNS;

  protected readonly sound = signal(false);
  protected readonly soldOutOpen = signal(false);
  private readonly now = signal(Date.now());
  private timer: ReturnType<typeof setInterval> | null = null;
  private audio: AudioContext | null = null;
  private seen = new Set<string>();

  protected readonly cards = computed<Card[]>(() =>
    this.floor
      .kots()
      .filter((k) => k.status === 'new' || k.status === 'preparing' || k.status === 'ready')
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((kot) => {
        const order = this.floor.order(kot.order_id);
        const where = !order ? 'Order' : order.type === 'dine_in' ? 'Table ' + (this.floor.tableName(order.table_id) ?? '?') : order.type === 'takeaway' ? 'Takeaway' : 'Delivery';
        return { kot, where, orderNo: order?.order_no ?? null, items: this.floor.itemsOf(kot.order_id).filter((i) => i.kot_id === kot.id && i.item_id !== null) };
      }),
  );

  protected readonly byStatus = computed(() => {
    const out: Record<string, Card[]> = { new: [], preparing: [], ready: [] };
    for (const c of this.cards()) out[c.kot.status]!.push(c);
    return out;
  });

  constructor() {
    // Ring once for each KOT this screen has not seen before.
    effect(() => {
      const fresh = this.cards().filter((c) => c.kot.status === 'new' && !this.seen.has(c.kot.id));
      const first = this.seen.size === 0;
      for (const c of this.cards()) this.seen.add(c.kot.id);
      if (fresh.length && !first) this.beep();
    });
  }

  public ngOnInit(): void {
    this.timer = setInterval(() => this.now.set(Date.now()), 30000);
  }

  public ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    void this.audio?.close();
  }

  protected age(k: Kot): number {
    return minutesSince(k.created_at, this.now());
  }

  protected ageClass(k: Kot): string {
    const m = this.age(k);
    return m >= 20 ? 'text-rose-600' : m >= 10 ? 'text-amber-600' : 'text-ink-500';
  }

  protected ringClass(k: Kot): string {
    const m = this.age(k);
    return m >= 20 ? 'ring-rose-400' : m >= 10 ? 'ring-amber-300' : 'ring-transparent';
  }

  protected addonNames(i: OrderItem): string {
    return i.addons.map((a) => a.name).join(', ');
  }

  protected print(c: Card): void {
    const order = this.floor.order(c.kot.order_id);
    if (order) this.printer.kot(order, c.kot, c.items, this.floor.tableName(order.table_id));
  }

  protected toggleSound(): void {
    if (!this.sound()) {
      this.audio ??= new AudioContext();
      void this.audio.resume();
      this.sound.set(true);
      this.beep();
    } else {
      this.sound.set(false);
    }
  }

  private beep(): void {
    if (!this.sound() || !this.audio) return;
    const ctx = this.audio;
    // Two short rising tones: noticeable over kitchen noise, not alarming.
    [880, 1320].forEach((freq, n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + n * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + n * 0.22 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + n * 0.22 + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + n * 0.22);
      osc.stop(ctx.currentTime + n * 0.22 + 0.21);
    });
  }
}
