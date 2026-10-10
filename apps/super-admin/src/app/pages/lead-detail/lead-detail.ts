import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '@app/core/auth.store';
import { LeadStore } from '@app/core/lead.store';
import { currentPosition, osmLink } from '@app/core/geolocation';
import {
  ACTIVITY_LABEL,
  ACTIVITY_TYPES,
  BILLING_LABEL,
  LOST_REASONS,
  OUTCOMES,
  OUTCOME_LABEL,
  PLAN_LABEL,
  RESTAURANT_TYPE_LABEL,
  SOURCE_LABEL,
  STAGES,
  STAGE_LABEL,
  followUpClass,
  followUpState,
  shortDate,
  stageClass,
  todayIso,
  type Activity,
  type ActivityType,
  type Lead,
  type Outcome,
  type Stage,
} from '@app/core/crm';
import { WHATSAPP_TEMPLATES, fillTemplate, whatsAppLink } from '@app/core/whatsapp-templates';
import { ConvertLead } from './convert-lead';

/** What an outcome usually means for the stage, so logging it moves the lead too. */
const OUTCOME_STAGE: Partial<Record<Outcome, Stage>> = {
  demo_booked: 'demo_booked',
  trial_started: 'trial',
  won: 'paying',
  lost: 'lost',
};

@Component({
  selector: 'app-lead-detail',
  imports: [FormsModule, RouterLink, ConvertLead],
  templateUrl: './lead-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadDetail implements OnInit {
  readonly id = input.required<string>();

  protected readonly store = inject(LeadStore);
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly stages = STAGES;
  protected readonly stageLabel = STAGE_LABEL;
  protected readonly typeLabel = RESTAURANT_TYPE_LABEL;
  protected readonly billingLabel = BILLING_LABEL;
  protected readonly sourceLabel = SOURCE_LABEL;
  protected readonly planLabel = PLAN_LABEL;
  protected readonly activityTypes = ACTIVITY_TYPES;
  protected readonly activityLabel = ACTIVITY_LABEL;
  protected readonly outcomes = OUTCOMES;
  protected readonly outcomeLabel = OUTCOME_LABEL;
  protected readonly lostReasons = LOST_REASONS;
  protected readonly templates = WHATSAPP_TEMPLATES;
  protected readonly stageClass = stageClass;
  protected readonly shortDate = shortDate;

  protected readonly lead = computed(() => this.store.find(this.id()) ?? null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly activities = signal<readonly Activity[]>([]);

  // Log-activity form
  protected readonly type = signal<ActivityType>('call');
  protected readonly outcome = signal<Outcome | null>(null);
  protected readonly note = signal('');
  protected readonly nextStage = signal<Stage | null>(null);
  protected readonly lostReason = signal('');
  protected readonly nextFollowUp = signal<string>(todayIso(2));
  protected readonly logging = signal(false);
  protected readonly logError = signal<string | null>(null);

  // WhatsApp
  protected readonly templateKey = signal(WHATSAPP_TEMPLATES[0]!.key);
  protected readonly message = signal('');

  protected readonly confirmingDelete = signal(false);

  protected readonly osmLink = osmLink;
  protected readonly locating = signal(false);
  protected readonly locationError = signal<string | null>(null);

  /** On a visit: save where the restaurant is, from the device's GPS. */
  protected saveMyLocation(lead: Lead): void {
    this.locating.set(true);
    this.locationError.set(null);
    currentPosition().then(
      (p) =>
        this.store.update(lead.id, { latitude: p.latitude, longitude: p.longitude, locationAccuracyM: p.accuracyM }, () =>
          this.locating.set(false),
        ),
      (e: Error) => {
        this.locationError.set(e.message);
        this.locating.set(false);
      },
    );
  }

  protected readonly followUp = computed(() => {
    const lead = this.lead();
    if (!lead) return null;
    const state = followUpState(lead);
    return state === 'closed' ? null : { state, cls: followUpClass(state) };
  });

  protected readonly closing = computed(() => {
    const s = this.nextStage();
    return s === 'paying' || s === 'lost';
  });

  public ngOnInit(): void {
    this.store.fetch(this.id()).subscribe({
      next: () => this.pickTemplate(this.templateKey()),
      error: (e: Error) => this.loadError.set(e.message),
    });
    this.reloadActivities();
  }

  protected reloadActivities(): void {
    this.store.activities(this.id()).subscribe({
      next: (list) => this.activities.set(list),
      error: (e: Error) => this.loadError.set(e.message),
    });
  }

  protected tri(value: boolean | null): string {
    return value === null ? 'Not asked' : value ? 'Yes' : 'No';
  }

  protected setOutcome(outcome: Outcome | null): void {
    this.outcome.set(outcome);
    const stage = outcome ? OUTCOME_STAGE[outcome] : undefined;
    if (stage) this.nextStage.set(stage);
  }

  protected log(): void {
    const lead = this.lead();
    if (!lead) return;
    const body: Record<string, unknown> = { type: this.type(), outcome: this.outcome(), note: this.note() || null };
    const stage = this.nextStage();
    if (stage && stage !== lead.stage) body['stage'] = stage;
    if (stage === 'lost') body['lostReason'] = this.lostReason().trim();
    // A closed lead needs no follow-up; an open one always gets the date shown in the form.
    body['nextFollowUpOn'] = this.closing() ? null : this.nextFollowUp() || null;

    this.logging.set(true);
    this.logError.set(null);
    this.store.logActivity(lead.id, body).subscribe({
      next: ({ activity }) => {
        this.activities.update((list) => [activity, ...list]);
        this.note.set('');
        this.outcome.set(null);
        this.nextStage.set(null);
        this.lostReason.set('');
        this.nextFollowUp.set(todayIso(2));
        this.logging.set(false);
      },
      error: (e: Error) => {
        this.logError.set(e.message);
        this.logging.set(false);
      },
    });
  }

  protected removeActivity(activity: Activity): void {
    this.store.removeActivity(activity.leadId, activity.id).subscribe({
      next: () => this.activities.update((list) => list.filter((a) => a.id !== activity.id)),
      error: (e: Error) => this.logError.set(e.message),
    });
  }

  protected pickTemplate(key: string): void {
    this.templateKey.set(key);
    const lead = this.lead();
    const template = WHATSAPP_TEMPLATES.find((t) => t.key === key);
    if (lead && template) this.message.set(fillTemplate(template.body, lead, this.auth.user()?.name ?? 'Thaliyo'));
  }

  protected waLink(lead: Lead): string | null {
    return whatsAppLink(lead, this.message());
  }

  /** Opening WhatsApp is the send; log it so the timeline shows the message went out. */
  protected sentWhatsApp(lead: Lead): void {
    const template = WHATSAPP_TEMPLATES.find((t) => t.key === this.templateKey());
    this.store
      .logActivity(lead.id, { type: 'whatsapp', note: (template?.label ?? 'Message') + ' sent:\n' + this.message() })
      .subscribe({ next: ({ activity }) => this.activities.update((list) => [activity, ...list]) });
  }

  protected setStage(lead: Lead, stage: Stage): void {
    if (stage === 'lost') {
      this.nextStage.set('lost');
      return;
    }
    this.store.update(lead.id, { stage });
  }

  protected doDelete(lead: Lead): void {
    this.store.remove(lead.id, (ok) => ok && void this.router.navigate(['/leads']));
  }

  protected when(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }
}
