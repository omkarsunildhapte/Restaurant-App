import type { Lead } from '@app/core/crm';

/**
 * WhatsApp messages for each step of the sale, opened with wa.me so they go from the
 * salesperson's own WhatsApp (no Business API needed yet). {owner} and {restaurant} are
 * filled from the lead; the salesperson can still edit before sending.
 */
export interface WhatsAppTemplate {
  readonly key: string;
  readonly label: string;
  readonly body: string;
}

export const WHATSAPP_TEMPLATES: readonly WhatsAppTemplate[] = [
  {
    key: 'intro',
    label: 'Intro',
    body:
      'Namaste {owner}, this is {me} from Thaliyo, Pune. We make billing, kitchen screen and waiter ordering software for cafés and restaurants like {restaurant} — at 0% commission, with setup done by us.\n\n' +
      'Can I show you a 10-minute demo at {restaurant} this week? Any time between 3 and 5 pm works for us.',
  },
  {
    key: 'demo-reminder',
    label: 'Demo reminder',
    body:
      'Hi {owner}, reminder for our demo at {restaurant} on {date}. It takes 10 minutes: waiter app, kitchen screen, GST bill and your sales dashboard. See you then — {me}, Thaliyo.',
  },
  {
    key: 'after-demo',
    label: 'After the demo',
    body:
      'Thank you for your time today, {owner}. As discussed, {restaurant} gets a 14-day free trial — we set up the menu, printer and train your staff. Shall we start on Monday?',
  },
  {
    key: 'welcome',
    label: 'Welcome (after Create restaurant)',
    body:
      'Welcome to Thaliyo, {owner}! You will get an email from us now: open it and set your password. That is your owner login for the Business panel.\n\n' +
      'On setup day ({date}) we add the menu, tables and staff, connect the printer and train the team. Please keep ready: menu, GSTIN, staff names with email, and the printer. Any question, reply here. — {me}, Thaliyo',
  },
  {
    key: 'trial-check-in',
    label: 'Trial check-in',
    body:
      'Hi {owner}, how is the trial going at {restaurant}? Any problem with billing, printing or the kitchen screen, just reply here and we will fix it today.',
  },
  {
    key: 'payment-reminder',
    label: 'Payment reminder',
    body:
      'Hi {owner}, the free trial at {restaurant} ends on {date}. To keep using it, the plan is {plan} per month, cancel anytime. Shall I send the payment link?',
  },
];

const PLAN_PRICE: Record<string, string> = { starter: '₹1,499', pro: '₹2,999', chain: '₹4,999' };

export function fillTemplate(body: string, lead: Lead, me: string): string {
  const date = lead.nextFollowUpOn
    ? new Date(lead.nextFollowUpOn + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : '[date]';
  return body
    .replaceAll('{owner}', lead.ownerName?.split(/\s+/)[0] ?? 'Sir/Madam')
    .replaceAll('{restaurant}', lead.restaurantName)
    .replaceAll('{me}', me.split(/\s+/)[0] ?? me)
    .replaceAll('{date}', date)
    .replaceAll('{plan}', PLAN_PRICE[lead.expectedPlan ?? 'starter']!);
}

/** A wa.me link for a stored 10-digit Indian number, or null when there is none. */
export function whatsAppLink(lead: Lead, text: string): string | null {
  const number = lead.whatsapp ?? lead.phone;
  if (!number) return null;
  return 'https://wa.me/91' + number + '?text=' + encodeURIComponent(text);
}
