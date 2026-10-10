/**
 * Sales CRM types and the labels the console shows for them. The values match the
 * CHECK constraints in backend/marketing/db/001_crm.sql.
 */

export const STAGES = [
  'new',
  'contacted',
  'demo_booked',
  'demo_done',
  'trial',
  'onboarding',
  'paying',
  'lost',
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  new: 'New',
  contacted: 'Contacted',
  demo_booked: 'Demo booked',
  demo_done: 'Demo done',
  trial: 'Trial',
  onboarding: 'Onboarding',
  paying: 'Paying',
  lost: 'Lost',
};

export const RESTAURANT_TYPES = [
  'cafe',
  'family_restaurant',
  'qsr',
  'cloud_kitchen',
  'bakery',
  'bar',
  'chain',
  'other',
] as const;
export type RestaurantType = (typeof RESTAURANT_TYPES)[number];

export const RESTAURANT_TYPE_LABEL: Record<RestaurantType, string> = {
  cafe: 'Café',
  family_restaurant: 'Family restaurant',
  qsr: 'QSR / fast food',
  cloud_kitchen: 'Cloud kitchen',
  bakery: 'Bakery',
  bar: 'Bar / lounge',
  chain: 'Chain',
  other: 'Other',
};

export const BILLING = ['unknown', 'paper', 'petpooja', 'other_software', 'none'] as const;
export type Billing = (typeof BILLING)[number];

export const BILLING_LABEL: Record<Billing, string> = {
  unknown: 'Not asked yet',
  paper: 'Paper / manual',
  petpooja: 'Petpooja',
  other_software: 'Other software',
  none: 'No billing',
};

export const SOURCES = [
  'website',
  'walk_in',
  'dealer',
  'referral',
  'instagram',
  'google_ads',
  'expo',
  'import',
  'other',
] as const;
export type Source = (typeof SOURCES)[number];

export const SOURCE_LABEL: Record<Source, string> = {
  website: 'Website form',
  walk_in: 'Walk-in visit',
  dealer: 'Dealer / partner',
  referral: 'Referral',
  instagram: 'Instagram',
  google_ads: 'Google Ads',
  expo: 'Expo / association',
  import: 'CSV import',
  other: 'Other',
};

export const PLANS = ['starter', 'pro', 'chain'] as const;
export type Plan = (typeof PLANS)[number];

export const PLAN_LABEL: Record<Plan, string> = {
  starter: 'Starter · ₹1,499',
  pro: 'Pro · ₹2,999',
  chain: 'Chain · ₹4,999+',
};

export const ACTIVITY_TYPES = ['call', 'visit', 'whatsapp', 'demo', 'email', 'note'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  call: 'Call',
  visit: 'Visit',
  whatsapp: 'WhatsApp',
  demo: 'Demo',
  email: 'Email',
  note: 'Note',
};

export const OUTCOMES = [
  'no_answer',
  'interested',
  'call_back',
  'not_interested',
  'demo_booked',
  'trial_started',
  'won',
  'lost',
] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const OUTCOME_LABEL: Record<Outcome, string> = {
  no_answer: 'No answer',
  interested: 'Interested',
  call_back: 'Call back',
  not_interested: 'Not interested',
  demo_booked: 'Demo booked',
  trial_started: 'Trial started',
  won: 'Won',
  lost: 'Lost',
};

/** Common reasons, offered as suggestions; the field itself is free text. */
export const LOST_REASONS = [
  'Happy with Petpooja / current software',
  'Price too high',
  'Owner not interested',
  'Shop closed',
  'Too small for software',
  'Chose a competitor',
  'No response after many tries',
];

/** Pune areas from GO-TO-MARKET.md, in visiting order; any other area can be typed. */
export const PUNE_AREAS = [
  'Baner',
  'Balewadi',
  'Koregaon Park',
  'Kalyani Nagar',
  'Viman Nagar',
  'Aundh',
  'Kothrud',
  'Wakad',
  'Hinjewadi',
  'FC Road',
  'JM Road',
];

export interface Lead {
  id: string;
  restaurantName: string;
  restaurantType: RestaurantType;
  ownerName: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  area: string | null;
  city: string;
  address: string | null;
  mapsUrl: string | null;
  seats: number | null;
  outlets: number;
  currentBilling: Billing;
  billingSoftware: string | null;
  onAggregators: boolean | null;
  monthlyAggregatorOrders: number | null;
  hasWebsite: boolean | null;
  hasOwnRiders: boolean | null;
  stage: Stage;
  lostReason: string | null;
  expectedPlan: Plan | null;
  source: Source;
  dealerId: string | null;
  dealerName: string | null;
  assignedTo: string | null;
  assignedName: string | null;
  nextFollowUpOn: string | null;
  lastActivityAt: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  locationAccuracyM: number | null;
  /** The restaurant on the platform this lead became (public.tenants.id), once converted. */
  tenantId: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type LeadInput = Omit<
  Lead,
  'id' | 'dealerName' | 'assignedName' | 'lastActivityAt' | 'tenantId' | 'convertedAt' | 'createdAt' | 'updatedAt'
>;

export interface Activity {
  id: string;
  leadId: string;
  type: ActivityType;
  outcome: Outcome | null;
  note: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'sales';
  isActive: boolean;
  lastLoginAt: string | null;
  openLeads: number;
  paying: number;
  followUpsDue: number;
}

export interface Dealer {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  area: string | null;
  city: string;
  commissionPct: number;
  isActive: boolean;
  notes: string | null;
  leads: number;
  paying: number;
  monthlyCommissionInr: number;
  createdAt: string;
}

export interface AreaRow {
  area: string;
  total: number;
  open: number;
  paying: number;
  due: number;
}

export interface Summary {
  total: number;
  byStage: Record<Stage, number>;
  funnel: { stage: Stage; reached: number; fromPrevious: number | null }[];
  trialToPaidPct: number | null;
  bySource: { source: Source; total: number; paying: number }[];
  lostReasons: { reason: string; count: number }[];
  followUps: { overdue: number; today: number; unscheduled: number };
  mrrInr: number;
  trialPipelineInr: number;
  churned: number;
  thisMonth: { newLeads: number; won: number };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function money(value: number): string {
  return inr.format(value);
}

/** Today in the browser's time zone, as YYYY-MM-DD (what a date input holds). */
export function todayIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export type FollowUpState = 'overdue' | 'today' | 'upcoming' | 'none' | 'closed';

export function followUpState(lead: Pick<Lead, 'stage' | 'nextFollowUpOn'>): FollowUpState {
  if (lead.stage === 'paying' || lead.stage === 'lost') return 'closed';
  if (!lead.nextFollowUpOn) return 'none';
  const today = todayIso();
  if (lead.nextFollowUpOn < today) return 'overdue';
  return lead.nextFollowUpOn === today ? 'today' : 'upcoming';
}

export function shortDate(iso: string | null): string {
  if (!iso) return '—';
  const d = iso.length === 10 ? new Date(iso + 'T00:00:00') : new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function stageClass(stage: Stage): string {
  switch (stage) {
    case 'paying':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
    case 'trial':
    case 'onboarding':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
    case 'demo_booked':
    case 'demo_done':
      return 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300';
    case 'contacted':
      return 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300';
    case 'lost':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300';
    default:
      return 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300';
  }
}

export function followUpClass(state: FollowUpState): string {
  switch (state) {
    case 'overdue':
      return 'text-rose-600 dark:text-rose-400';
    case 'today':
      return 'text-amber-600 dark:text-amber-400';
    default:
      return 'text-ink-500 dark:text-ink-400';
  }
}
