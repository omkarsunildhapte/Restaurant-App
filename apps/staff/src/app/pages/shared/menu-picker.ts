import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuStore } from '@app/core/menu.store';
import { money, round2, type Addon, type MenuItem, type Variant } from '@app/core/models';
import type { NewItem } from '@app/core/floor.store';
import { I18n, TPipe } from '@app/core/i18n';

/**
 * Menu for taking an order: category chips, search, item tiles. An item with sizes or add-ons
 * opens a small chooser; anything else is added with one tap. Veg / egg / non-veg marks follow
 * the FSSAI style (green dot, yellow, brown triangle).
 */
@Component({
  selector: 'app-menu-picker',
  imports: [FormsModule, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full min-h-0 flex-col">
      <div class="flex gap-2 border-b border-ink-200 bg-white p-2">
        <input type="search" [ngModel]="query()" (ngModelChange)="query.set($event)" [placeholder]="'menu.search' | t" [attr.aria-label]="'menu.searchLabel' | t" class="field mt-0 flex-1 py-2" />
      </div>
      @if (store.fromCache()) {
        <p class="bg-amber-50 px-3 py-1 text-xs text-amber-800">{{ 'menu.cached' | t }}</p>
      }
      @if (store.error()) {
        <p class="bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{{ store.error() }}</p>
      }
      <div class="flex gap-1.5 overflow-x-auto border-b border-ink-200 bg-white px-2 py-2" role="tablist" [attr.aria-label]="'menu.categories' | t">
        <button type="button" role="tab" [attr.aria-selected]="!category()" (click)="category.set(null)" class="chip" [class.chip-on]="!category()">{{ 'menu.all' | t }}</button>
        @for (c of store.menu().categories; track c.id) {
          <button type="button" role="tab" [attr.aria-selected]="category() === c.id" (click)="category.set(c.id)" class="chip" [class.chip-on]="category() === c.id">{{ c.name }}</button>
        }
      </div>
      <div class="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-2 sm:grid-cols-3 xl:grid-cols-4">
        @for (item of visible(); track item.id) {
          <button type="button" (click)="tap(item)" [disabled]="!item.is_available"
            class="flex min-h-20 flex-col rounded-xl border border-ink-200 bg-white p-3 text-left shadow-sm active:scale-[.98] disabled:opacity-40">
            <span class="flex items-start gap-1.5">
              <span class="diet" [class]="'diet-' + item.diet" [attr.aria-label]="dietLabel[item.diet] | t"></span>
              <span class="text-sm font-semibold leading-snug text-ink-900">{{ item.name }}</span>
            </span>
            <span class="mt-auto pt-1 text-sm text-ink-600">{{ priceLabel(item) }}{{ item.is_available ? '' : ' · ' + ('menu.soldOut' | t) }}</span>
          </button>
        } @empty {
          <p class="col-span-full py-10 text-center text-sm text-ink-400">{{ 'menu.noMatch' | t }}</p>
        }
      </div>
    </div>

    @if (choosing(); as item) {
      <div class="fixed inset-0 z-40 grid place-items-end bg-ink-900/50 sm:place-items-center" role="dialog" aria-modal="true" [attr.aria-label]="item.name">
        <div class="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 sm:max-w-md sm:rounded-2xl">
          <h2 class="text-lg font-semibold text-ink-900">{{ item.name }}</h2>
          @if (variants().length) {
            <p class="mt-4 text-xs font-semibold uppercase text-ink-500">{{ 'menu.size' | t }}</p>
            <div class="mt-2 grid grid-cols-2 gap-2">
              @for (v of variants(); track v.id) {
                <button type="button" (click)="variant.set(v)" class="rounded-lg border px-3 py-2 text-left text-sm" [class]="variant()?.id === v.id ? 'border-brand-600 bg-brand-50 font-semibold' : 'border-ink-200'">{{ v.name }} · {{ money(v.price) }}</button>
              }
            </div>
          }
          @for (g of groups(); track g.id) {
            <p class="mt-4 text-xs font-semibold uppercase text-ink-500">{{ g.name }}{{ g.min_select ? ' · ' + ('menu.pickAtLeast' | t: { n: g.min_select }) : '' }}{{ g.max_select ? ' · ' + ('menu.upTo' | t: { n: g.max_select }) : '' }}</p>
            <div class="mt-2 grid grid-cols-2 gap-2">
              @for (a of g.addons; track a.id) {
                <button type="button" (click)="toggleAddon(g.id, a, g.max_select)" class="rounded-lg border px-3 py-2 text-left text-sm" [class]="picked().has(a.id) ? 'border-brand-600 bg-brand-50 font-semibold' : 'border-ink-200'">{{ a.name }}{{ a.price ? ' +' + money(a.price) : '' }}</button>
              }
            </div>
          }
          <label class="mt-4 block text-xs font-semibold uppercase text-ink-500" for="mp-notes">{{ 'menu.note' | t }}</label>
          <input id="mp-notes" [ngModel]="notes()" (ngModelChange)="notes.set($event)" [placeholder]="'menu.notePlaceholder' | t" class="field" />
          <div class="mt-4 flex items-center gap-3">
            <div class="flex items-center rounded-lg border border-ink-200">
              <button type="button" (click)="qty.set(qty() > 1 ? qty() - 1 : 1)" class="px-3 py-2 text-lg" [attr.aria-label]="'menu.fewer' | t">−</button>
              <span class="w-8 text-center font-semibold" aria-live="polite">{{ qty() }}</span>
              <button type="button" (click)="qty.set(qty() + 1)" class="px-3 py-2 text-lg" [attr.aria-label]="'menu.more' | t">+</button>
            </div>
            @if (problem(); as p) { <p class="text-xs text-rose-600">{{ p }}</p> }
          </div>
          <div class="mt-5 flex gap-2">
            <button type="button" (click)="choosing.set(null)" class="btn-secondary flex-1 py-3">{{ 'menu.cancel' | t }}</button>
            <button type="button" (click)="confirm()" [disabled]="!!problem()" class="btn-primary flex-1 py-3">{{ 'menu.add' | t: { amount: money(choiceTotal()) } }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class MenuPicker {
  readonly add = output<NewItem>();

  protected readonly store = inject(MenuStore);
  protected readonly money = money;
  private readonly i18n = inject(I18n);
  protected readonly dietLabel = { veg: 'diet.veg', egg: 'diet.egg', non_veg: 'diet.non_veg' } as const;

  protected readonly query = signal('');
  protected readonly category = signal<string | null>(null);

  protected readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.category();
    return this.store
      .menu()
      .items.filter((i) => (!cat || i.category_id === cat) && (!q || i.name.toLowerCase().includes(q)))
      .sort((a, b) => Number(b.is_available) - Number(a.is_available) || a.sort_order - b.sort_order);
  });

  // Chooser state
  protected readonly choosing = signal<MenuItem | null>(null);
  protected readonly variant = signal<Variant | null>(null);
  protected readonly picked = signal<Map<string, Addon & { group: string }>>(new Map());
  protected readonly qty = signal(1);
  protected readonly notes = signal('');
  protected readonly variants = computed(() => (this.choosing() ? this.store.variantsOf(this.choosing()!.id) : []));
  protected readonly groups = computed(() => (this.choosing() ? this.store.groupsOf(this.choosing()!.id) : []));

  protected readonly problem = computed(() => {
    if (this.variants().length && !this.variant()) return this.i18n.t('menu.chooseSize');
    for (const g of this.groups()) {
      const n = [...this.picked().values()].filter((a) => a.group === g.id).length;
      if (n < g.min_select) return this.i18n.t('menu.pickFrom', { n: g.min_select, group: g.name });
    }
    return null;
  });

  protected readonly choiceTotal = computed(() => {
    const item = this.choosing();
    if (!item) return 0;
    const base = this.variant()?.price ?? item.price;
    return round2((base + [...this.picked().values()].reduce((s, a) => s + a.price, 0)) * this.qty());
  });

  protected priceLabel(item: MenuItem): string {
    const v = this.store.variantsOf(item.id);
    return v.length ? this.i18n.t('menu.from', { price: money(Math.min(...v.map((x) => x.price))) }) : money(item.price);
  }

  protected tap(item: MenuItem): void {
    if (!this.store.variantsOf(item.id).length && !this.store.groupsOf(item.id).length) {
      this.add.emit({ item, variant: null, addons: [], quantity: 1, notes: null });
      return;
    }
    this.variant.set(null);
    this.picked.set(new Map());
    this.qty.set(1);
    this.notes.set('');
    this.choosing.set(item);
  }

  protected toggleAddon(group: string, addon: Addon, max: number | null): void {
    const next = new Map(this.picked());
    if (next.has(addon.id)) next.delete(addon.id);
    else {
      const inGroup = [...next.values()].filter((a) => a.group === group);
      if (max === 1 && inGroup.length) next.delete(inGroup[0]!.id);
      else if (max && inGroup.length >= max) return;
      next.set(addon.id, { ...addon, group });
    }
    this.picked.set(next);
  }

  protected confirm(): void {
    const item = this.choosing();
    if (!item || this.problem()) return;
    this.add.emit({
      item,
      variant: this.variant(),
      addons: [...this.picked().values()].map((a) => ({ name: a.name, price: a.price })),
      quantity: this.qty(),
      notes: this.notes().trim() || null,
    });
    this.choosing.set(null);
  }
}
