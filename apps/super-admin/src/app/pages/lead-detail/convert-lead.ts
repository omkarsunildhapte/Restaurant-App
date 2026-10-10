import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LeadStore } from '@app/core/lead.store';
import { PlatformApi } from '@app/core/platform/platform.api';
import type { Plan } from '@app/core/platform/platform.models';
import type { Lead } from '@app/core/crm';

/** "Bean & Brew Café, Baner" -> "bean-brew-cafe-baner": what the API accepts as a slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

/**
 * Turns a won lead into a restaurant on the platform: creates the tenant, its first outlet
 * and the owner's login (invited by email if they have no account) through the Node API,
 * then links it to the lead, which moves the pipeline to Trial. Super Admins only - the
 * platform API refuses everyone else.
 */
@Component({
  selector: 'app-convert-lead',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Block, so the page's space-y gap applies to this element like the cards around it.
  host: { class: 'block' },
  template: `
    @let l = lead();
    @if (l.tenantId) {
      <section class="card border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/5">
        <h2 class="text-sm font-semibold text-emerald-800 dark:text-emerald-300" data-testid="converted">On the platform</h2>
        <p class="mt-1 text-sm text-emerald-800/80 dark:text-emerald-300/80">Restaurant created{{ l.convertedAt ? ' on ' + day(l.convertedAt) : '' }}. Trial check-in is set as the next follow-up.</p>
        <a [routerLink]="['/platform/restaurants', l.tenantId]" class="mt-2 inline-block text-sm font-medium text-emerald-700 underline dark:text-emerald-300">Open restaurant →</a>
      </section>
    } @else if (!open()) {
      <section class="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-sm font-semibold text-ink-900 dark:text-white">Ready to start?</h2>
          <p class="text-xs text-ink-500 dark:text-ink-400">Create the restaurant, invite the owner and start the free trial.</p>
        </div>
        <button type="button" (click)="start()" class="btn-primary">Create restaurant</button>
      </section>
    } @else {
      <form class="card space-y-3" (ngSubmit)="submit()">
        <h2 class="text-sm font-semibold text-ink-900 dark:text-white">Create restaurant on the platform</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label for="cv-name" class="field-label">Restaurant name</label>
            <input id="cv-name" name="name" required [ngModel]="name()" (ngModelChange)="setName($event)" class="field" />
          </div>
          <div>
            <label for="cv-slug" class="field-label">Web address name</label>
            <input id="cv-slug" name="slug" required [ngModel]="slug()" (ngModelChange)="slug.set($event)" class="field font-mono" />
          </div>
          <div>
            <label for="cv-email" class="field-label">Owner email *</label>
            <input id="cv-email" name="ownerEmail" type="email" required [ngModel]="ownerEmail()" (ngModelChange)="ownerEmail.set($event)" class="field" />
          </div>
          <div>
            <label for="cv-owner" class="field-label">Owner name</label>
            <input id="cv-owner" name="ownerName" [ngModel]="ownerName()" (ngModelChange)="ownerName.set($event)" class="field" />
          </div>
          <div>
            <label for="cv-plan" class="field-label">Plan</label>
            <select id="cv-plan" name="planId" [ngModel]="planId()" (ngModelChange)="planId.set($event)" class="field">
              @for (p of plans(); track p.id) {
                <option [value]="p.id">{{ p.name }} · ₹{{ p.price_monthly }}/month</option>
              } @empty {
                <option [value]="planId()">{{ planId() }}</option>
              }
            </select>
          </div>
          <div>
            <label for="cv-trial" class="field-label">Free trial (days)</label>
            <input id="cv-trial" name="trialDays" type="number" min="0" max="90" [ngModel]="trialDays()" (ngModelChange)="trialDays.set(+$event)" class="field" />
          </div>
          <div>
            <label for="cv-outlet" class="field-label">First outlet name</label>
            <input id="cv-outlet" name="outletName" [ngModel]="outletName()" (ngModelChange)="outletName.set($event)" class="field" />
          </div>
          <div>
            <label for="cv-city" class="field-label">City</label>
            <input id="cv-city" name="city" [ngModel]="city()" (ngModelChange)="city.set($event)" class="field" />
          </div>
        </div>
        <p class="text-xs text-ink-500 dark:text-ink-400">The owner gets an email to set their password if they don't have an account yet.</p>
        @if (error()) {
          <p class="text-sm text-rose-600 dark:text-rose-400" role="alert">{{ error() }}</p>
        }
        <div class="flex justify-end gap-2">
          <button type="button" (click)="open.set(false)" class="btn-secondary">Cancel</button>
          <button type="submit" [disabled]="busy() || !valid()" class="btn-primary">{{ busy() ? 'Creating…' : 'Create and start trial' }}</button>
        </div>
      </form>
    }
  `,
})
export class ConvertLead implements OnInit {
  readonly lead = input.required<Lead>();
  /** Fires once the restaurant exists and is linked, so the page can reload its history. */
  readonly converted = output<void>();

  private readonly platform = inject(PlatformApi);
  private readonly store = inject(LeadStore);

  protected readonly open = signal(false);
  protected readonly plans = signal<readonly Plan[]>([]);
  protected readonly name = signal('');
  protected readonly slug = signal('');
  protected readonly ownerEmail = signal('');
  protected readonly ownerName = signal('');
  protected readonly planId = signal('starter');
  protected readonly trialDays = signal(14);
  protected readonly outletName = signal('');
  protected readonly city = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Set when the restaurant exists but linking it to the lead failed: retry only the link. */
  private createdTenantId: string | null = null;

  public ngOnInit(): void {
    const l = this.lead();
    this.name.set(l.restaurantName);
    this.slug.set(slugify(l.restaurantName + (l.area ? ' ' + l.area : '')));
    this.ownerEmail.set(l.email ?? '');
    this.ownerName.set(l.ownerName ?? '');
    this.planId.set(l.expectedPlan ?? 'starter');
    this.outletName.set(l.area ? `${l.restaurantName}, ${l.area}` : l.restaurantName);
    this.city.set(l.city);
  }

  protected start(): void {
    this.open.set(true);
    this.platform.plans().subscribe({
      next: (plans) => this.plans.set(plans.filter((p) => p.is_active)),
      error: () => this.plans.set([]), // the plan id still goes through; the API checks it
    });
  }

  protected setName(value: string): void {
    // Keep the slug following the name until someone edits the slug by hand.
    if (this.slug() === slugify(this.name()) || this.slug() === '') this.slug.set(slugify(value));
    this.name.set(value);
  }

  protected valid(): boolean {
    return (
      this.name().trim().length >= 2 &&
      /^[a-z0-9]+(-[a-z0-9]+)*$/.test(this.slug()) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.ownerEmail().trim())
    );
  }

  protected submit(): void {
    if (!this.valid()) return;
    this.busy.set(true);
    this.error.set(null);
    if (this.createdTenantId) {
      this.link(this.createdTenantId);
      return;
    }
    this.platform
      .createTenant({
        name: this.name().trim(),
        slug: this.slug(),
        ownerEmail: this.ownerEmail().trim(),
        ownerName: this.ownerName().trim() || undefined,
        planId: this.planId(),
        outletName: this.outletName().trim() || undefined,
        city: this.city().trim() || undefined,
        phone: this.lead().phone ?? undefined,
        trialDays: this.trialDays(),
      })
      .subscribe({
        next: (result) => {
          this.createdTenantId = result.tenant_id;
          this.link(result.tenant_id);
        },
        error: (e: Error) => {
          this.error.set(e.message);
          this.busy.set(false);
        },
      });
  }

  private link(tenantId: string): void {
    this.store.markConverted(this.lead().id, tenantId).subscribe({
      next: () => {
        this.busy.set(false);
        this.open.set(false);
        this.converted.emit();
      },
      error: (e: Error) => {
        this.error.set('The restaurant was created, but linking it to this lead failed: ' + e.message + ' Press the button again to retry the link.');
        this.busy.set(false);
      },
    });
  }

  protected day(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}
