import { AccountNavItem } from '@appTypes/navigation.types';

/** Account screen. */
export const ACCOUNT_PAGE = {
  GENERAL: [
    { id: 'account-information', header: 'Account information', subHeader: 'Change your Account information', icon: 'person' },
    { id: 'password', header: 'Password', subHeader: 'Change your Password', icon: 'lock-closed' },
  ] as readonly AccountNavItem[],
  MORE: [
    { id: 'rate-us', header: 'Rate Us', subHeader: 'You will receive daily updates', icon: 'star' },
    { id: 'faq', header: 'FAQ', subHeader: 'Frequently Asked Questions', icon: 'book' },
  ] as readonly AccountNavItem[],
  /** Shown in the avatar when the rider has no display name yet. */
  FALLBACK_INITIAL: 'A',
} as const;
