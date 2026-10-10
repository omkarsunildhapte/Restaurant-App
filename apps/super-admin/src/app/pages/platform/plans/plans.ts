import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlatformApi } from '@app/core/platform/platform.api';
import { FEATURES, type Plan } from '@app/core/platform/platform.models';

interface PlanDraft {
  id: string;
  name: string;
  priceMonthly: number;
  /** Empty string = unlimited */
  maxOutlets: number | '';
  features: Record<string, boolean>;
  isActive: boolean;
}

function draftOf(p: Plan): PlanDraft {
  return {
    id: p.id,
    name: p.name,
    priceMonthly: Number(p.price_monthly),
    maxOutlets: p.max_outlets ?? '',
    features: { ...p.features },
    isActive: p.is_active,
  };
}

/** Plan prices, outlet limits and which features each plan includes. */
@Component({
  selector: 'app-platform-plans',
  imports: [FormsModule],
  templateUrl: './plans.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformPlans implements OnInit {
  private readonly api = inject(PlatformApi);

  protected readonly drafts = signal<readonly PlanDraft[]>([]);
  protected readonly saving = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly features = FEATURES;

  public ngOnInit(): void {
    this.api.plans().subscribe({
      next: (plans) => this.drafts.set(plans.map(draftOf)),
      error: (e: Error) => this.error.set(e.message),
    });
  }

  protected update(id: string, change: Partial<PlanDraft>): void {
    this.drafts.update((list) => list.map((d) => (d.id === id ? { ...d, ...change } : d)));
  }

  protected toggleFeature(d: PlanDraft, key: string): void {
    this.update(d.id, { features: { ...d.features, [key]: !d.features[key] } });
  }

  protected save(d: PlanDraft): void {
    this.saving.set(d.id);
    this.error.set(null);
    this.api
      .updatePlan(d.id, {
        name: d.name,
        priceMonthly: Number(d.priceMonthly),
        maxOutlets: d.maxOutlets === '' ? null : Number(d.maxOutlets),
        features: d.features,
        isActive: d.isActive,
      })
      .subscribe({
        next: (saved) => {
          this.saving.set(null);
          this.update(d.id, draftOf(saved));
          this.notice.set(saved.name + ' saved. Restaurants on this plan get the change straight away.');
        },
        error: (e: Error) => {
          this.saving.set(null);
          this.error.set(e.message);
        },
      });
  }
}
