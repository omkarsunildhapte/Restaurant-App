import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SessionStore } from '@app/core/session.store';
import { TPipe, type I18nKey } from '@app/core/i18n';
import type { Role } from '@app/core/models';

const ROLE_LABEL: Record<Role, I18nKey> = {
  admin: 'role.admin', owner: 'role.owner', manager: 'role.manager', cashier: 'role.cashier', waiter: 'role.waiter', kitchen: 'role.kitchen', delivery: 'role.delivery',
};

/** Which business and outlet this device works at today (remembered on the device). */
@Component({
  selector: 'app-choose',
  imports: [TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-xl px-4 py-10">
      <h1 class="text-2xl font-semibold text-ink-900">{{ 'choose.title' | t }}</h1>
      <p class="mt-1 text-sm text-ink-500">{{ 'choose.hint' | t }}</p>
      <ul class="mt-6 space-y-3">
        @for (w of session.workspaces(); track w.tenant_id + w.role) {
          @for (o of session.outletsFor(w); track o.id) {
            <li>
              <button type="button" (click)="session.choose(w, o.id)" class="card flex w-full items-center justify-between gap-3 text-left hover:border-brand-400">
                <span>
                  <span class="block font-semibold text-ink-900">{{ w.tenant_name }}</span>
                  <span class="block text-sm text-ink-500">{{ o.name }}{{ o.city ? ' · ' + o.city : '' }}</span>
                </span>
                <span class="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{{ roleLabel[w.role] | t }}</span>
              </button>
            </li>
          }
        } @empty {
          <li class="text-sm text-ink-500">{{ 'choose.none' | t }}</li>
        }
      </ul>
      <button type="button" (click)="session.logout()" class="mt-8 text-sm text-ink-500 underline">{{ 'choose.signOut' | t }}</button>
    </main>
  `,
})
export class Choose {
  protected readonly session = inject(SessionStore);
  protected readonly roleLabel = ROLE_LABEL;
}
