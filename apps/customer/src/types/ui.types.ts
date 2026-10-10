import { NavLink } from '@appTypes/common.types';

/** A row in the account screen's menus. */
export interface AccountMenuItem extends NavLink {
  subLabel: string;
  /** Opened in a new tab instead of routed (e.g. "Rate us"). */
  externalUrl?: string;
}

/** A static review card (placeholder until reviews are wired). */
export interface ReviewCard {
  id: string;
  author: string;
  avatar: string;
  postedAt: string;
  body: string;
  likes: number;
}

/** A static order-history card (placeholder until orders are wired). */
export interface HistoryCard {
  id: string;
  date: string;
  restaurant: string;
  address: string;
  amount: number;
  itemCount: number;
  image: string;
}

/** A payment option tile on the confirm-order screen. */
export interface PaymentOption {
  type: 'paypal' | 'cash' | 'card';
  label: string;
  image?: string;
  icon?: string;
  tileClass: string;
  amountClass: string;
  labelClass: string;
}

/** A segment button (tabs inside a page). */
export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
}

/** One bottom tab, plus the other /main screens that keep it highlighted. */
export interface TabItem extends NavLink {
  /** Last URL segments that count as this tab. */
  matches: readonly string[];
}

/** The part of a Signal Forms field that FieldErrors reads (any FieldTree satisfies it). */
export type FieldErrorsSource = () => {
  touched(): boolean;
  errors(): readonly { kind: string; message?: string }[];
};
