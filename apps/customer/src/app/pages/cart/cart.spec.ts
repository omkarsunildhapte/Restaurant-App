import { Cart } from '@pages/cart/cart';
import { FoodService } from '@services/food/food.service';
import { CART } from '@testing/fixtures';
import { renderPage, settle } from '@testing/test-providers';

describe('Cart', () => {
  it('shows the empty cart', async () => {
    const { fixture, element } = await renderPage(Cart);
    await settle(fixture);
    expect(element.textContent).toContain('Your cart is empty.');
  });

  it('totals the cart and updates it as quantities change', async () => {
    const service = { listCart: () => Promise.resolve(CART), updateCart: vi.fn().mockRejectedValue(new Error('x')) };
    const { fixture, ui } = await renderPage(Cart, { providers: [{ provide: FoodService, useValue: service }] });
    await settle(fixture);
    const page = fixture.componentInstance;
    expect(page.total()).toBe(450);
    page.change(0, 1);
    expect(page.total()).toBe(650);
    page.change(0, -1, 0);
    expect(page.total()).toBe(600);
    await page.confirm();
    expect(ui.toast.notConnected).toHaveBeenCalled();
  });
});
