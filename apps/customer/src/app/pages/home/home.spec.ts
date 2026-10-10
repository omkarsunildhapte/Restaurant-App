import { Home } from '@pages/home/home';
import { FoodService } from '@services/food/food.service';
import { MENU } from '@testing/fixtures';
import { renderPage, settle } from '@testing/test-providers';

describe('Home', () => {
  it('shows empty states while the menu is not connected', async () => {
    const { fixture, element } = await renderPage(Home);
    await settle(fixture);
    expect(element.textContent).toContain('No menu items yet.');
    expect(element.textContent).toContain('No combos yet.');
  });

  it('groups the menu into singles and combos, linked to the item screen', async () => {
    const { fixture, element } = await renderPage(Home, { providers: [{ provide: FoodService, useValue: { listFoods: () => Promise.resolve(MENU) } }] });
    await settle(fixture);
    expect(fixture.componentInstance.singles().map((f) => f.itemName)).toEqual(['Veg Thali']);
    expect(fixture.componentInstance.combos().map((f) => f.itemName)).toEqual(['Burger Combo']);
    expect(element.querySelector('a[href*="food-review"]')?.getAttribute('href')).toBe('/main/food-review?id=f1');
  });
});
