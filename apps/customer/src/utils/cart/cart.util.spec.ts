import { CartItem } from '@appTypes/food.types';
import { cartTotal, changeQuantity, mainItemTotal, subItemTotal, subItemsTotal, toOrderLines } from '@utils/cart/cart.util';

const cart: CartItem[] = [
  { id: 'a', name: 'Thali', price: 200, totalNumber: 2, image: 'thali.png', subItem: [{ name: 'Lassi', price: 50, totalNumber: 1, image: 'lassi.png' }] },
  { id: 'b', name: 'Dosa', price: 120, totalNumber: 1, image: 'dosa.png', subItem: [] },
];

describe('cart utils', () => {
  it('prices lines, add-ons and the whole cart', () => {
    expect(mainItemTotal(cart[0])).toBe(400);
    expect(subItemTotal(cart[0].subItem[0])).toBe(50);
    expect(subItemsTotal(cart[0])).toBe(50);
    expect(cartTotal(cart)).toBe(570);
    expect(cartTotal([])).toBe(0);
  });

  it('changes a quantity immutably and never below zero', () => {
    const more = changeQuantity(cart, 1, 1);
    expect(more[1].totalNumber).toBe(2);
    expect(cart[1].totalNumber).toBe(1);
    expect(changeQuantity(cart, 1, -5)[1].totalNumber).toBe(0);
    expect(changeQuantity(cart, 0, 1, 0)[0].subItem[0].totalNumber).toBe(2);
  });

  it('builds order lines (add-on amounts use the main quantity, as before)', () => {
    expect(toOrderLines(cart)[0]).toEqual({ name: 'Thali', image: 'thali.png', amount: 400, subItems: [{ name: 'Lassi', image: 'lassi.png', amount: 100 }] });
  });
});
