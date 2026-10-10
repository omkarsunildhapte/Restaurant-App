import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PlatformApi } from '@app/core/platform/platform.api';
import {
  STATUSES,
  STATUS_LABEL,
  daysLeft,
  shortDate,
  statusClass,
  type NewTenant,
  type Plan,
  type TenantRow,
  type TenantStatus,
} from '@app/core/platform/platform.models';

function blankForm(): NewTenant {
  return { name: '', slug: '', ownerEmail: '', ownerName: '', planId: 'pro', outletName: '', city: 'Pune', phone: '', trialDays: 14 };
}

/** "Café Mocha & Co." → "cafe-mocha-co" */
function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** All restaurants on the platform, and creating a new one (assisted onboarding). */
@Component({
  selector: 'app-platform-restaurants',
  imports: [FormsModule, RouterLink],
  templateUrl: './restaurants.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformRestaurants implements OnInit {
  private readonly api = inject(PlatformApi);
  private readonly router = inject(Router);

  /** ?status=trial and ?new=1 from links on the overview. */
  readonly status = input<string>();
  readonly new = input<string>();

  protected readonly rows = signal<readonly TenantRow[]>([]);
  protected readonly plans = signal<readonly Plan[]>([]);
  protected readonly loading = signal(false);
  protected readonly loaded = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly search = signal('');
  protected readonly statusFilter = signal<TenantStatus | ''>('');

  protected readonly creating = signal(false);
  protected readonly form = signal<NewTenant>(blankForm());
  protected readonly slugEdited = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly statuses = STATUSES;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly statusClass = statusClass;
  protected readonly daysLeft = daysLeft;
  protected readonly shortDate = shortDate;

  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  public ngOnInit(): void {
    const s = this.status();
    if (s && (STATUSES as readonly string[]).includes(s)) this.statusFilter.set(s as TenantStatus);
    if (this.new()) this.creating.set(true);
    this.api.plans().subscribe({ next: (p) => this.plans.set(p.filter((x) => x.is_active)), error: () => undefined });
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.tenants({ status: this.statusFilter(), q: this.search().trim() }).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
        this.loaded.set(true);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }

  protected onSearch(value: string): void {
    this.search.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(), 300);
  }

  protected onStatus(value: TenantStatus | ''): void {
    this.statusFilter.set(value);
    this.load();
  }

  protected open(row: TenantRow): void {
    void this.router.navigate(['/platform/restaurants', row.id]);
  }

  protected patch(change: Partial<NewTenant>): void {
    this.form.update((f) => {
      const next = { ...f, ...change };
      if (change.name !== undefined && !this.slugEdited()) next.slug = slugify(change.name);
      return next;
    });
  }

  protected editSlug(value: string): void {
    this.slugEdited.set(true);
    this.patch({ slug: value });
  }

  protected cancelCreate(): void {
    this.creating.set(false);
    this.form.set(blankForm());
    this.slugEdited.set(false);
    this.formError.set(null);
  }

  protected create(): void {
    const f = this.form();
    const body: NewTenant = {
      ...f,
      ownerName: f.ownerName?.trim() || undefined,
      outletName: f.outletName?.trim() || undefined,
      city: f.city?.trim() || undefined,
      phone: f.phone?.trim() || undefined,
      trialDays: Number(f.trialDays),
    };
    this.saving.set(true);
    this.formError.set(null);
    this.api.createTenant(body).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.cancelCreate();
        void this.router.navigate(['/platform/restaurants', result.tenant_id], {
          queryParams: { created: result.owner },
        });
      },
      error: (e: Error) => {
        this.saving.set(false);
        this.formError.set(e.message);
      },
    });
  }
}
