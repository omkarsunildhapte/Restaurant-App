import { Entity } from '@appTypes/common.types';

/** Menu item kinds the screens group by. */
export type FoodKind = 'single' | 'combo' | 'beverage';

/** A menu item. Money is `number`, in rupees. */
export interface FoodItem extends Entity {
  itemName: string;
  description: string;
  price: number;
  category: string;
  type: FoodKind;
  logoUrl: string;
  bannerImage: string;
}

/** A menu item with the quantity the customer picked on the detail screen. */
export interface FoodSelection {
  item: FoodItem;
  quantity: number;
}

/** An add-on (beverage) line inside a cart line. */
export interface CartSubItem {
  name: string;
  price: number;
  totalNumber: number;
  image: string;
}

/** One cart line: the main item plus its add-ons. */
export interface CartItem {
  id: string;
  name: string;
  price: number;
  totalNumber: number;
  image: string;
  subItem: CartSubItem[];
}

/** A cart line as sent when adding to the cart (no id yet). */
export type NewCartItem = Omit<CartItem, 'id'>;

/** How the customer pays. */
export type PaymentType = 'cash' | 'card' | 'paypal';

/** One ordered line, priced. */
export interface OrderLine {
  name: string;
  image: string;
  amount: number;
  subItems: Omit<OrderLine, 'subItems'>[];
}

/** Order lifecycle states known to the app. */
export type OrderStatus = 'pending' | 'accepted' | 'out_for_delivery' | 'delivered' | 'cancelled';

/** A placed order. */
export interface FoodOrder {
  id?: string;
  items: OrderLine[];
  paymentType: PaymentType;
  totalValue: number;
  voucher: string;
  userId: string;
  status: OrderStatus;
  createDate: string;
}
