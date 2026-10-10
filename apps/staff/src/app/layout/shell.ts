import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionStore } from '@app/core/session.store';
import { MenuStore } from '@app/core/menu.store';
import { FloorStore } from '@app/core/floor.store';
import { DayStore } from '@app/core/day.store';
import { Outbox } from '@app/core/outbox';
import { Printer } from '@app/core/printer';
import { environment } from '../../environments/environment';
import { TPipe, type I18nKey } from '@app/core/i18n';
import { LangSwitch } from '@app/pages/shared/lang-switch';

const MODE = {
  waiter: { label: 'nav.tables', path: '/waiter' },
  kitchen: { label: 'nav.kitchen', path: '/kitchen' },
  pos: { label: 'nav.pos', path: '/pos' },
} as const satisfies Record<string, { label: I18nKey; path: string }>;

/** Top bar for every working screen: where you are, your screens, connection and sync state. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TPipe, LangSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-dvh flex-col bg-ink-50">
      <header class="flex h-14 shrink-0 items-center gap-2 border-b border-ink-200 bg-white px-3 sm:px-4">
        <img src="brand/thaliyo-emblem-256.png" alt="Thaliyo" width="32" height="32" class="size-8 shrink-0 object-contain" />
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold leading-tight text-ink-900">{{ session.outlet()?.name }}</p>
          <p class="truncate text-xs leading-tight text-ink-500">{{ session.workspace()?.tenant_name }} · {{ session.personName() }}</p>
        </div>

        <nav class="ml-2 flex gap-1" [attr.aria-label]="'nav.screens' | t">
          @for (m of session.modes(); track m) {
            <a [routerLink]="mode[m].path" routerLinkActive="bg-brand-600 text-white hover:bg-brand-600" class="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100">{{ mode[m].label | t }}</a>
          }
          @if (session.modes().includes('pos')) {
            <a routerLink="/bills" routerLinkActive="bg-brand-600 text-white hover:bg-brand-600" class="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100">{{ 'nav.bills' | t }}</a>
            <a routerLink="/day" routerLinkActive="bg-brand-600 text-white hover:bg-brand-600" class="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100">{{ 'nav.day' | t }}</a>
          }
        </nav>

        <div class="ml-auto flex items-center gap-2">
          <button type="button" (click)="showSync.set(!showSync())" class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            [class]="outbox.failed().length ? 'bg-rose-100 text-rose-800' : !outbox.online() ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'"
            [attr.aria-label]="'shell.connection' | t: { state: ((outbox.online() ? 'shell.online' : 'shell.offline') | t) }">
            <span class="size-2 rounded-full" [class]="outbox.online() ? 'bg-emerald-500' : 'bg-amber-500'"></span>
            {{ (outbox.online() ? 'shell.online' : 'shell.offline') | t }}
            @if (outbox.pendingCount()) { · {{ 'shell.toSync' | t: { n: outbox.pendingCount() } }} }
            @if (outbox.failed().length) { · {{ 'shell.failed' | t: { n: outbox.failed().length } }} }
          </button>
          <div class="relative">
            <button type="button" (click)="showMenu.set(!showMenu())" class="grid size-9 place-items-center rounded-lg text-ink-600 hover:bg-ink-100" [attr.aria-label]="'shell.menu' | t" [attr.aria-expanded]="showMenu()">
              <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            @if (showMenu()) {
              <div class="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-ink-200 bg-white p-1.5 shadow-lg" role="menu">
                <p class="px-3 pb-1 pt-2 text-xs font-semibold uppercase text-ink-400">{{ 'shell.paper' | t }}</p>
                <div class="flex gap-1 px-2 pb-2">
                  @for (w of [58, 80]; track w) {
                    <button type="button" (click)="printer.setWidth($any(w))" class="flex-1 rounded-md py-1 text-sm" [class]="printer.width() === w ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-700'">{{ w }} mm</button>
                  }
                </div>
                <p class="px-3 pb-1 pt-1 text-xs font-semibold uppercase text-ink-400">{{ 'shell.printing' | t }}</p>
                <div class="space-y-1 px-2 pb-2">
                  <button type="button" (click)="printer.useDriver()" class="w-full rounded-md px-2 py-1 text-left text-sm" [class]="printer.mode() === 'driver' ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-700'">{{ 'shell.printDialog' | t }}</button>
                  @if (printer.supports('usb')) {
                    <button type="button" (click)="printer.pair('usb')" class="w-full rounded-md px-2 py-1 text-left text-sm" [class]="printer.mode() === 'usb' ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-700'">{{ 'shell.directUsb' | t }}{{ printer.mode() === 'usb' ? '' : ' ' + ('shell.pair' | t) }}</button>
                  }
                  @if (printer.supports('serial')) {
                    <button type="button" (click)="printer.pair('serial')" class="w-full rounded-md px-2 py-1 text-left text-sm" [class]="printer.mode() === 'serial' ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-700'">{{ 'shell.directSerial' | t }}{{ printer.mode() === 'serial' ? '' : ' ' + ('shell.pair' | t) }}</button>
                  }
                  @if (printer.mode() !== 'driver') {
                    <p class="truncate px-1 text-xs text-ink-500">{{ printer.device() ?? ('shell.paired' | t) }}</p>
                    <button type="button" (click)="printer.testPrint()" class="text-xs font-medium text-brand-600">{{ 'shell.testPrint' | t }}</button>
                  }
                  @if (printer.error()) { <p class="px-1 text-xs text-rose-600" role="alert">{{ printer.error() }}</p> }
                </div>
                <p class="px-3 pb-1 pt-1 text-xs font-semibold uppercase text-ink-400">{{ 'lang.label' | t }}</p>
                <div class="px-2 pb-2"><app-lang-switch /></div>
                @if (helpHref()) {
                  <a role="menuitem" [href]="helpHref()" target="_blank" rel="noopener" class="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-100">{{ 'shell.help' | t }}</a>
                }
                <button type="button" role="menuitem" (click)="changeOutlet()" class="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-100">{{ 'shell.changeOutlet' | t }}</button>
                <button type="button" role="menuitem" (click)="session.logout()" class="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-100">{{ 'shell.signOut' | t }}</button>
              </div>
            }
          </div>
        </div>
      </header>

      @if (showSync()) {
        <section class="border-b border-ink-200 bg-white px-4 py-3 text-sm">
          <p class="text-ink-700">
            {{ (outbox.online() ? 'shell.connected' : 'shell.noInternet') | t }}
          </p>
          @for (f of outbox.failed(); track f.id) {
            <div class="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-rose-50 px-3 py-2">
              <span class="font-medium text-rose-800">{{ f.label }}:</span>
              <span class="text-rose-700">{{ f.error }}</span>
              <button type="button" (click)="outbox.retry(f.id)" class="ml-auto rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink-700">{{ 'shell.retry' | t }}</button>
              <button type="button" (click)="outbox.discard(f.id)" class="rounded-md px-2 py-1 text-xs text-rose-700 underline">{{ 'shell.discard' | t }}</button>
            </div>
          }
        </section>
      }

      <main class="min-h-0 flex-1 overflow-y-auto">
        <router-outlet />
      </main>
    </div>
  `,
})
export class Shell implements OnInit {
  protected readonly session = inject(SessionStore);
  protected readonly outbox = inject(Outbox);
  protected readonly printer = inject(Printer);
  private readonly menu = inject(MenuStore);
  private readonly floor = inject(FloorStore);
  private readonly day = inject(DayStore);
  private readonly router = inject(Router);

  protected readonly mode = MODE;
  protected readonly showMenu = signal(false);
  protected readonly showSync = signal(false);

  /** WhatsApp to Thaliyo support, with who and where already filled in. */
  protected helpHref(): string | null {
    const n = environment.supportWhatsApp;
    if (!n) return null;
    const text = `Hi Thaliyo, I need help. ${this.session.workspace()?.tenant_name ?? ''}, ${this.session.outlet()?.name ?? ''} (${this.session.personName()}, ${this.session.role()}).`;
    return 'https://wa.me/' + n + '?text=' + encodeURIComponent(text);
  }
  private hadPending = false;

  constructor() {
    // When the offline queue has just finished syncing, refresh what the server now knows
    // (bill numbers, GST from the server, the day's cash totals).
    effect(() => {
      const pending = this.outbox.pendingCount();
      if (pending === 0 && this.hadPending) {
        void this.floor.reload();
        if (this.session.modes().includes('pos')) void this.day.load();
      }
      this.hadPending = pending > 0;
    });
  }

  public ngOnInit(): void {
    void this.menu.load();
    // Sold-out changes made on another device show up within two minutes (and at once when a
    // table's order screen opens). The menu itself is not on Realtime.
    setInterval(() => void this.menu.load(), 120_000);
    this.floor.start();
    if (this.session.modes().includes('pos')) void this.day.load();
  }

  protected changeOutlet(): void {
    this.showMenu.set(false);
    void this.router.navigateByUrl('/choose');
  }
}
