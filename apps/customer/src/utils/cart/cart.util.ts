import { CartItem, CartSubItem, OrderLine } from '@appTypes/food.types';

/** Price of one add-on line. */
export function subItemTotal(sub: CartSubItem): number {
  return sub.price * sub.totalNumber;
}

/** Price of a cart line's add-ons. */
export function subItemsTotal(item: CartItem): number {
  return item.subItem.reduce((total, sub) => total + subItemTotal(sub), 0);
}

/** Price of a cart line's main item. */
export function mainItemTotal(item: CartItem): number {
  return item.price * item.totalNumber;
}

/** Whole cart: every main item plus its add-ons. */
export function cartTotal(items: readonly CartItem[]): number {
  return items.reduce((total, item) => total + mainItemTotal(item) + subItemsTotal(item), 0);
}

/** Cart lines as order lines. Add-on amounts use the main item's quantity, as the old app did. */
export function toOrderLines(items: readonly CartItem[]): OrderLine[] {
  return items.map((item) => ({
    name: item.name,
    image: item.image,
    amount: mainItemTotal(item),
    subItems: item.subItem.map((sub) => ({ name: sub.name, image: sub.image, amount: sub.price * item.totalNumber })),
  }));
}

/** A copy of the cart with one line's (or add-on's) quantity changed by `delta`, never below 0. */
export function changeQuantity(items: readonly CartItem[], index: number, delta: number, subIndex?: number): CartItem[] {
  return items.map((item, i) => {
    if (i !== index) return item;
    if (subIndex === undefined) return { ...item, totalNumber: Math.max(0, item.totalNumber + delta) };
    return {
      ...item,
      subItem: item.subItem.map((sub, j) => (j === subIndex ? { ...sub, totalNumber: Math.max(0, sub.totalNumber + delta) } : sub)),
    };
  });
}
