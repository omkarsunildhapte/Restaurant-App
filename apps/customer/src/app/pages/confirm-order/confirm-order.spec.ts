import { ConfirmOrder } from '@pages/confirm-order/confirm-order';
import { FoodService } from '@services/food/food.service';
import { CART } from '@testing/fixtures';
import { renderPage, settle } from '@testing/test-providers';

describe('ConfirmOrder', () => {
  it('adds the delivery charge and offers every payment option', async () => {
    const { fixture, element } = await renderPage(ConfirmOrder, { providers: [{ provide: FoodService, useValue: { listCart: () => Promise.resolve(CART) } }] });
    await settle(fixture);
    expect(fixture.componentInstance.total()).toBe(460);
    expect(element.textContent).toContain('Cash on Delivery');
    expect(element.textContent).toContain('Paypal');
  });

  it('toasts "Not connected yet" when placing the order', async () => {
    const { fixture, ui } = await renderPage(ConfirmOrder);
    await settle(fixture);
    await fixture.componentInstance.placeOrder();
    expect(ui.toast.notConnected).toHaveBeenCalled();
  });
});
