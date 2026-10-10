/**
 * Staff app text in English: the source of every key. hi.ts and mr.ts are typed against this,
 * so a key missing there fails the build. `{name}` marks a value filled in at run time.
 * Not translated: dish names, receipts and KOT prints (stay English for GST), server errors.
 */
export const en = {
  // Language switch
  'lang.label': 'Language',

  // Login
  'login.tagline': 'Staff · POS · Kitchen · Waiter',
  'login.title': 'Sign in',
  'login.hint': 'Use the account your restaurant added you with.',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.submit': 'Sign in',
  'login.busy': 'Signing in…',

  // Choose outlet
  'choose.title': 'Where are you working?',
  'choose.hint': 'This device will remember it. You can change it from the menu later.',
  'choose.none': 'This account is not on the staff of any restaurant.',
  'choose.signOut': 'Sign out',
  'role.admin': 'Admin',
  'role.owner': 'Owner',
  'role.manager': 'Manager',
  'role.cashier': 'Cashier',
  'role.waiter': 'Waiter',
  'role.kitchen': 'Kitchen',
  'role.delivery': 'Delivery',

  // Tables (waiter floor)
  'tables.free': 'Free',
  'tables.ordering': 'Ordering',
  'tables.billRequested': 'Bill requested',
  'tables.seats': '{n} seats',
  'tables.minutes': '{n} min',
  'tables.area': 'Tables',
  'tables.loading': 'Loading tables…',
  'tables.none': 'No tables set up for this outlet yet. The owner adds them in the Business panel.',

  // Order ticket
  'ticket.round': 'Round {n}',
  'ticket.new': 'New',
  'ticket.empty': 'Tap dishes to add them.',
  'ticket.paid': 'Paid',
  'ticket.less': 'One less {name}',
  'ticket.more': 'One more {name}',
  'kot.new': 'Sent',
  'kot.preparing': 'Preparing',
  'kot.ready': 'Ready',
  'kot.served': 'Served',
  'kot.cancelled': 'Cancelled',

  // Menu picker
  'menu.search': 'Search dishes…',
  'menu.searchLabel': 'Search dishes',
  'menu.cached': 'Showing the menu saved on this device.',
  'menu.categories': 'Categories',
  'menu.all': 'All',
  'menu.soldOut': 'sold out',
  'menu.noMatch': 'No dishes match.',
  'menu.from': 'from {price}',
  'menu.size': 'Size',
  'menu.pickAtLeast': 'pick at least {n}',
  'menu.upTo': 'up to {n}',
  'menu.note': 'Note for the kitchen',
  'menu.notePlaceholder': 'Less spicy, no onion…',
  'menu.fewer': 'Fewer',
  'menu.more': 'More',
  'menu.chooseSize': 'Choose a size',
  'menu.pickFrom': 'Pick {n} from {group}',
  'menu.cancel': 'Cancel',
  'menu.add': 'Add · {amount}',
  'diet.veg': 'Veg',
  'diet.egg': 'Contains egg',
  'diet.non_veg': 'Non-veg',
} as const;

export type I18nKey = keyof typeof en;
