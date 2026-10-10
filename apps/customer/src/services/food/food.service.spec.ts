import { TestBed } from '@angular/core/testing';
import { FoodOrder } from '@appTypes/food.types';
import { FoodService } from '@services/food/food.service';
import { NotImplementedError } from '@utils/not-implemented/not-implemented.util';

describe('FoodService (Phase 8 stubs)', () => {
  const service = () => TestBed.inject(FoodService);

  it('reads resolve empty', async () => {
    await expect(service().listFoods()).resolves.toEqual([]);
    await expect(service().getFood('1')).resolves.toBeNull();
    await expect(service().listCart('u')).resolves.toEqual([]);
    await expect(service().listOrders('u')).resolves.toEqual([]);
  });

  it('writes reject with NotImplementedError', async () => {
    const order = {} as FoodOrder;
    await expect(service().addToCart('u', { name: 'x', price: 1, totalNumber: 1, image: '', subItem: [] })).rejects.toBeInstanceOf(NotImplementedError);
    await expect(service().updateCart('u', [])).rejects.toBeInstanceOf(NotImplementedError);
    await expect(service().clearCart('u')).rejects.toBeInstanceOf(NotImplementedError);
    await expect(service().placeOrder(order)).rejects.toBeInstanceOf(NotImplementedError);
  });
});
