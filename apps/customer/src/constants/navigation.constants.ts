import { AccountMenuItem, TabItem } from '@appTypes/ui.types';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';

/** Bottom tab bar of the /main layout. `matches` = last URL segments that keep the tab highlighted. */
export const NAV_ITEMS: readonly TabItem[] = [
  { label: 'Home', path: APP_ROUTE_LINKS.HOME, icon: 'home-outline', matches: ['home'] },
  { label: 'Food', path: APP_ROUTE_LINKS.FOODS, icon: 'fast-food-outline', matches: ['foods', 'food-review', 'track'] },
  { label: 'Table Booking', path: APP_ROUTE_LINKS.TABLE, icon: 'storefront-outline', matches: ['table', 'table-details', 'table-confirm'] },
  { label: 'Cart', path: APP_ROUTE_LINKS.CART, icon: 'cart-outline', matches: ['add-cart', 'confirm-order'] },
  { label: 'Account', path: APP_ROUTE_LINKS.ACCOUNT, icon: 'person-outline', matches: ['account', 'account-information', 'change-password', 'payment-method', 'histroy'] },
];

/** Account screen menus. */
export const ACCOUNT_MENU: { readonly GENERAL: readonly AccountMenuItem[]; readonly MORE: readonly AccountMenuItem[] } = {
  GENERAL: [
    { label: 'Account information', subLabel: 'Change your Account information', icon: 'person', path: APP_ROUTE_LINKS.ACCOUNT_INFORMATION },
    { label: 'Password', subLabel: 'Change your Password', icon: 'lock-closed', path: APP_ROUTE_LINKS.CHANGE_PASSWORD },
    { label: 'Payment Methods', subLabel: 'Add your Credit & Debit Cards', icon: 'card', path: APP_ROUTE_LINKS.PAYMENT_METHODS },
    { label: 'Delivery Locations', subLabel: 'Change your Delivery Locations', icon: 'location', path: APP_ROUTE_LINKS.LOCATION },
    { label: 'History', subLabel: 'History Of Account', icon: 'hourglass-outline', path: APP_ROUTE_LINKS.HISTORY },
  ],
  MORE: [
    { label: 'Rate Us', subLabel: 'You will receive daily updates', icon: 'star', path: '', externalUrl: 'https://www.youtube.com/' },
    { label: 'FAQ', subLabel: 'Frequently Asked Questions', icon: 'book', path: '' },
  ],
};
