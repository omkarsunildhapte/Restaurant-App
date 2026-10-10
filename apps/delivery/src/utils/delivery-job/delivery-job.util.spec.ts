import { isFinished, toRiderOrder } from '@utils/delivery-job/delivery-job.util';
import { deliveryJobRow } from '@testing/delivery-fixtures';

describe('toRiderOrder', () => {
  it('maps an open job with pickup and drop positions', () => {
    const order = toRiderOrder(deliveryJobRow());
    expect(order).toMatchObject({
      id: 'job-1',
      status: 'assigned',
      orderNo: 17,
      outletName: 'Brew & Leaf Baner',
      pickup: { lat: 18.559, lng: 73.7867 },
      drop: { lat: 18.57, lng: 73.77 },
      customerName: 'Meera',
      deliveryAddress: 'Flat 4, Balewadi High Street',
      codAmount: 230,
      items: [{ name: 'Cold coffee', variant: null, quantity: 2 }],
    });
  });

  it('copes with a finished job (customer details hidden) and missing positions', () => {
    const order = toRiderOrder(deliveryJobRow({ status: 'delivered', finished_at: '2026-10-10T08:00:00Z', customer_name: null, customer_phone: null, delivery_address: null, delivery_lat: null, delivery_lng: null, outlet_lat: null, outlet_lng: null }));
    expect(order.customerName).toBeNull();
    expect(order.deliveryAddress).toBe('');
    expect(order.pickup).toBeNull();
    expect(order.drop).toBeNull();
    expect(isFinished(order)).toBe(true);
  });

  it('drops malformed item entries', () => {
    const order = toRiderOrder(deliveryJobRow({ items: [{ name: 'Tea', variant: 'Large', quantity: 1 }, { name: 3 }, 'x', null] }));
    expect(order.items).toEqual([{ name: 'Tea', variant: 'Large', quantity: 1 }]);
  });

  it('treats only delivered, failed and cancelled as finished', () => {
    expect(isFinished({ status: 'picked_up' })).toBe(false);
    expect(isFinished({ status: 'cancelled' })).toBe(true);
  });
});
