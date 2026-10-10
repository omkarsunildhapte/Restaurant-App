import { Foods } from '@pages/foods/foods';
import { FoodService } from '@services/food/food.service';
import { MENU } from '@testing/fixtures';
import { renderPage, settle } from '@testing/test-providers';

describe('Foods', () => {
  it('shows an empty state with no menu', async () => {
    const { fixture, element } = await renderPage(Foods);
    await settle(fixture);
    expect(element.textContent).toContain('No menu items yet.');
  });

  it('lists every menu item with its price', async () => {
    const { fixture, element } = await renderPage(Foods, { providers: [{ provide: FoodService, useValue: { listFoods: () => Promise.resolve(MENU) } }] });
    await settle(fixture);
    expect(element.querySelectorAll('ion-item').length).toBe(MENU.length);
    expect(element.textContent).toContain('Veg Thali');
    expect(element.textContent).toContain('200');
  });
});
