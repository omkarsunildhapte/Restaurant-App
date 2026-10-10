import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PlatformApi } from '@app/core/platform/platform.api';
import {
  FEATURES,
  ROLE_LABEL,
  STATUSES,
  STATUS_LABEL,
  daysLeft,
  shortDate,
  statusClass,
  type Features,
  type Plan,
  type TenantDetail,
  type TenantRole,
  type TenantStatus,
} from '@app/core/platform/platform.models';

/** yyyy-mm-dd for <input type="date">, in local time. */
function dateInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

/** One restaurant: subscription, feature switches, outlets, staff, invites and internal notes. */
@Component({
  selector: 'app-platform-restaurant-detail',
  imports: [FormsModule, RouterLink],
  templateUrl: './restaurant-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformRestaurantDetail implements OnInit {
  private readonly api = inject(PlatformApi);

  readonly id = input.required<string>();
  /** ?created=invited|added after "New restaurant". */
  readonly created = input<string>();

  protected readonly detail = signal<TenantDetail | null>(null);
  protected readonly plans = signal<readonly Plan[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

  // Subscription form
  protected readonly planId = signal('');
  protected readonly status = signal<TenantStatus>('trial');
  protected readonly trialEnds = signal('');
  protected readonly overrides = signal<Features>({});
  protected readonly savingSub = signal(false);

  protected readonly notes = signal('');
  protected readonly savingNotes = signal(false);

  protected readonly inviteEmail = signal('');
  protected readonly inviteRole = signal<TenantRole>('owner');
  protected readonly inviteOutlet = signal('');
  protected readonly inviting = signal(false);

  protected readonly features = FEATURES;
  protected readonly statuses = STATUSES;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly statusClass = statusClass;
  protected readonly roleLabel = ROLE_LABEL;
  protected readonly roles = Object.keys(ROLE_LABEL) as TenantRole[];
  protected readonly daysLeft = daysLeft;
  protected readonly shortDate = shortDate;

  /** Feature switches the selected plan gives, before overrides. */
  protected readonly planFeatures = computed<Features>(
    () => this.plans().find((p) => p.id === this.planId())?.features ?? {},
  );

  protected readonly outletName = computed(() => {
    const names = new Map((this.detail()?.outlets ?? []).map((o) => [o.id, o.name]));
    return (id: string | null) => (id ? (names.get(id) ?? 'Outlet') : 'All outlets');
  });

  public ngOnInit(): void {
    const c = this.created();
    if (c === 'invited') this.notice.set('Restaurant created. The owner has been emailed a link to set a password.');
    if (c === 'added') this.notice.set('Restaurant created. The owner already had an account and can sign in now.');
    this.api.plans().subscribe({ next: (p) => this.plans.set(p), error: () => undefined });
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    this.api.tenant(this.id()).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.planId.set(d.tenant.plan_id);
        this.status.set(d.tenant.status);
        this.trialEnds.set(dateInput(d.tenant.trial_ends_at));
        this.overrides.set({ ...d.tenant.feature_overrides });
        this.notes.set(d.notes);
      },
      error: (e: Error) => this.error.set(e.message),
    });
  }

  /** On / off / plan default for one feature switch. */
  protected featureState(key: string): 'on' | 'off' | 'plan' {
    const o = this.overrides();
    return key in o ? (o[key] ? 'on' : 'off') : 'plan';
  }

  protected setFeature(key: string, state: 'on' | 'off' | 'plan'): void {
    this.overrides.update((o) => {
      const next = { ...o };
      if (state === 'plan') delete next[key];
      else next[key] = state === 'on';
      return next;
    });
  }

  protected extendTrial(days: number): void {
    const from = Math.max(Date.now(), this.trialEnds() ? new Date(this.trialEnds()).getTime() : 0);
    this.trialEnds.set(dateInput(new Date(from + days * 86_400_000).toISOString()));
    if (this.status() !== 'trial') this.status.set('trial');
  }

  protected saveSubscription(): void {
    const trial = this.trialEnds();
    this.savingSub.set(true);
    this.error.set(null);
    this.api
      .updateTenant(this.id(), {
        planId: this.planId(),
        status: this.status(),
        // End of that day, India time
        trialEndsAt: trial ? new Date(trial + 'T23:59:59+05:30').toISOString() : null,
        featureOverrides: this.overrides(),
      })
      .subscribe({
        next: () => {
          this.savingSub.set(false);
          this.notice.set('Subscription saved.');
          this.load();
        },
        error: (e: Error) => {
          this.savingSub.set(false);
          this.error.set(e.message);
        },
      });
  }

  protected saveNotes(): void {
    this.savingNotes.set(true);
    this.api.saveNotes(this.id(), this.notes()).subscribe({
      next: () => {
        this.savingNotes.set(false);
        this.notice.set('Notes saved.');
      },
      error: (e: Error) => {
        this.savingNotes.set(false);
        this.error.set(e.message);
      },
    });
  }

  protected invite(): void {
    this.inviting.set(true);
    this.error.set(null);
    this.api
      .inviteMember(this.id(), {
        email: this.inviteEmail().trim(),
        role: this.inviteRole(),
        outletId: this.inviteOutlet() || null,
      })
      .subscribe({
        next: ({ status }) => {
          this.inviting.set(false);
          this.inviteEmail.set('');
          this.notice.set(
            status === 'invited'
              ? 'Invitation emailed.'
              : status === 'added'
                ? 'They already had an account and have been added.'
                : 'That person is already part of this restaurant.',
          );
          this.load();
        },
        error: (e: Error) => {
          this.inviting.set(false);
          this.error.set(e.message);
        },
      });
  }

  protected resend(invitationId: string): void {
    this.api.resendInvitation(invitationId).subscribe({
      next: () => this.notice.set('Invitation sent again.'),
      error: (e: Error) => this.error.set(e.message),
    });
  }
}
