import { Track } from '@pages/track/track';
import { FoodService } from '@services/food/food.service';
import { ORDER } from '@testing/fixtures';
import { renderPage, settle } from '@testing/test-providers';

describe('Track', () => {
  it('says there is nothing to track yet', async () => {
    const { fixture, element } = await renderPage(Track);
    await settle(fixture);
    expect(element.textContent).toContain('No order to track yet.');
  });

  it('shows the latest order and expands its lines', async () => {
    const { fixture, element } = await renderPage(Track, { providers: [{ provide: FoodService, useValue: { listOrders: () => Promise.resolve([ORDER]) } }] });
    await settle(fixture);
    expect(element.textContent).toContain('Veg Thali');
    expect(element.textContent).toContain('410');
    fixture.componentInstance.expanded.set(true);
    await fixture.whenStable();
    expect(element.textContent).toContain('Close Detail');
    const call = element.querySelector('ion-button.call') as (HTMLElement & { href?: string }) | null;
    expect(call?.href).toBe('tel:8530842830');
  });
});
