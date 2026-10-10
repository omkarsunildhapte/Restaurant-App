/** Route path segments (as used in the route config). URLs are unchanged from the old app. */
export const APP_ROUTES = {
  ROOT: '',
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forget',
  MAIN: 'main',
  PHONE_NUMBER: 'phonenumber',
  OTP: 'otp',
  LOCATION: 'location',
  HOME: 'home',
  FOODS: 'foods',
  FOOD_REVIEW: 'food-review',
  CART: 'add-cart',
  CONFIRM_ORDER: 'confirm-order',
  TRACK: 'track',
  TABLE: 'table',
  TABLE_DETAILS: 'table-details',
  TABLE_CONFIRM: 'table-confirm',
  ACCOUNT: 'account',
  ACCOUNT_INFORMATION: 'account-information',
  CHANGE_PASSWORD: 'change-password',
  PAYMENT_METHODS: 'payment-method',
  HISTORY: 'histroy',
  WILDCARD: '**',
} as const;

/** Absolute links for routerLink / programmatic navigation. */
export const APP_ROUTE_LINKS = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forget',
  PHONE_NUMBER: '/phonenumber',
  OTP: '/otp',
  LOCATION: '/location',
  HOME: '/main/home',
  FOODS: '/main/foods',
  FOOD_REVIEW: '/main/food-review',
  CART: '/main/add-cart',
  CONFIRM_ORDER: '/main/confirm-order',
  TRACK: '/main/track',
  TABLE: '/main/table',
  TABLE_DETAILS: '/main/table-details',
  TABLE_CONFIRM: '/main/table-confirm',
  ACCOUNT: '/main/account',
  ACCOUNT_INFORMATION: '/main/account-information',
  CHANGE_PASSWORD: '/main/change-password',
  PAYMENT_METHODS: '/main/payment-method',
  HISTORY: '/main/histroy',
} as const;

/** Query parameter names shared between screens. */
export const QUERY_PARAMS = {
  ID: 'id',
  PHONE_NUMBER: 'phoneNumber',
} as const;
