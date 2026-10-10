import { PaymentType } from '@appTypes/food.types';
import { PaymentOption } from '@appTypes/ui.types';

/** Confirm-order screen. */
export const CONFIRM_ORDER_PAGE: {
  readonly DELIVERY_CHARGE: number;
  readonly VOUCHER_CHARGE: number;
  readonly PAYMENT_TYPE: PaymentType;
  readonly DELIVERY_ADDRESS: string;
  readonly DISTANCE: string;
  readonly NO_VOUCHER: string;
  readonly PAYMENT_OPTIONS: readonly PaymentOption[];
} = {
  DELIVERY_CHARGE: 10,
  VOUCHER_CHARGE: 0,
  PAYMENT_TYPE: 'cash',
  DELIVERY_ADDRESS: '909-1/2 E 49th St Los Angeles, California(CA), 90011',
  DISTANCE: '1.5 km',
  NO_VOUCHER: '-',
  PAYMENT_OPTIONS: [
    { type: 'paypal', label: 'Paypal', image: 'icon/paypal.svg', tileClass: 'bg-primary-soft', amountClass: 'text-primary', labelClass: 'text-on-dark-accent' },
    { type: 'cash', label: 'Cash on Delivery', image: 'icon/cash.svg', tileClass: 'bg-slate-100', amountClass: 'text-slate-500', labelClass: 'text-slate-300' },
    { type: 'card', label: 'Card', icon: 'card', tileClass: 'bg-surface', amountClass: 'text-accent', labelClass: 'text-muted' },
  ],
};
