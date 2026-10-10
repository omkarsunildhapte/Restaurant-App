import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FoodReview } from '@pages/food-review/food-review';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { FoodService } from '@services/food/food.service';
import { FOOD_THALI, MENU } from '@testing/fixtures';
import { renderPage, settle } from '@testing/test-providers';

describe('FoodReview', () => {
  const foodService = () => ({
    listFoods: () => Promise.resolve(MENU),
    getFood: vi.fn().mockResolvedValue(FOOD_THALI),
    addToCart: vi.fn().mockRejectedValue(new Error('Not connected yet: add to cart')),
  });

  async function open(service = foodService()) {
    const page = await renderPage(FoodReview, { providers: [{ provide: FoodService, useValue: service }] });
    page.fixture.componentRef.setInput('id', 'f1');
    await settle(page.fixture);
    return { ...page, service };
  }

  it('shows an unavailable state when the item is missing', async () => {
    const { fixture, element } = await renderPage(FoodReview);
    fixture.componentRef.setInput('id', 'missing');
    await settle(fixture);
    expect(element.textContent).toContain('This item is not available.');
  });

  it('loads the item from ?id= and totals the item plus add-ons', async () => {
    const { fixture, element, service } = await open();
    expect(service.getFood).toHaveBeenCalledWith('f1');
    expect(element.textContent).toContain('Veg Thali');
    const page = fixture.componentInstance;
    expect(page.total()).toBe(200);
    page.changeQuantity(1);
    page.changeAddOn(0, 1);
    expect(page.total()).toBe(450);
    page.changeAddOn(0, -5);
    expect(page.addOnCounts()[0]).toBe(0);
  });

  it('toasts "Not connected yet" when adding to the cart', async () => {
    const { fixture, ui } = await open();
    await fixture.componentInstance.addToCart();
    expect(ui.toast.notConnected).toHaveBeenCalled();
  });

  it('goes to the cart once the cart is connected', async () => {
    const service = { ...foodService(), addToCart: vi.fn().mockResolvedValue(undefined) };
    const { fixture } = await open(service);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await fixture.componentInstance.addToCart();
    expect(service.addToCart).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'Veg Thali', totalNumber: 1 }));
    expect(navigate).toHaveBeenCalledWith(APP_ROUTE_LINKS.CART);
  });
});
