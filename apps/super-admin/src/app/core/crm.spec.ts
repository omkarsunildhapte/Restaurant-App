import { followUpState, money, todayIso } from './crm';
import { osmLink } from './geolocation';
import { fillTemplate, whatsAppLink } from './whatsapp-templates';
import type { Lead } from './crm';

describe('followUpState', () => {
  const today = todayIso();

  it('is closed for paying and lost leads, whatever the date', () => {
    expect(followUpState({ stage: 'paying', nextFollowUpOn: todayIso(-5) })).toBe('closed');
    expect(followUpState({ stage: 'lost', nextFollowUpOn: today })).toBe('closed');
  });

  it('sorts open leads into overdue, today, upcoming and none', () => {
    expect(followUpState({ stage: 'contacted', nextFollowUpOn: todayIso(-1) })).toBe('overdue');
    expect(followUpState({ stage: 'contacted', nextFollowUpOn: today })).toBe('today');
    expect(followUpState({ stage: 'trial', nextFollowUpOn: todayIso(3) })).toBe('upcoming');
    expect(followUpState({ stage: 'new', nextFollowUpOn: null })).toBe('none');
  });
});

describe('todayIso', () => {
  it('is a local YYYY-MM-DD date, offset by whole days', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const diff = (Date.parse(todayIso(7)) - Date.parse(todayIso())) / 86_400_000;
    expect(Math.round(diff)).toBe(7);
  });
});

describe('money', () => {
  it('formats rupees the Indian way, without paise', () => {
    expect(money(125000)).toBe('₹1,25,000');
  });
});

describe('WhatsApp templates', () => {
  const lead = {
    restaurantName: 'Chai Corner',
    ownerName: 'Sneha Patil',
    phone: '9876543210',
    whatsapp: null,
    nextFollowUpOn: null,
    expectedPlan: 'pro',
  } as unknown as Lead;

  it('fills owner first name, restaurant, sender first name and plan price', () => {
    const text = fillTemplate('Hi {owner}, {restaurant} on {plan} — {me}', lead, 'Omkar Dhapte');
    expect(text).toBe('Hi Sneha, Chai Corner on ₹2,999 — Omkar');
  });

  it('leaves a visible placeholder when there is no date yet', () => {
    expect(fillTemplate('on {date}', lead, 'Omkar')).toBe('on [date]');
  });

  it('links to wa.me with +91 and the message encoded, falling back to the phone', () => {
    expect(whatsAppLink(lead, 'Hello & welcome')).toBe('https://wa.me/919876543210?text=Hello%20%26%20welcome');
  });

  it('has no link without a number', () => {
    expect(whatsAppLink({ ...lead, phone: null } as Lead, 'x')).toBeNull();
  });
});

describe('osmLink', () => {
  it('opens the point on OpenStreetMap, not Google', () => {
    expect(osmLink(18.559012, 73.786754)).toBe(
      'https://www.openstreetmap.org/?mlat=18.559012&mlon=73.786754#map=18/18.559012/73.786754',
    );
  });
});
