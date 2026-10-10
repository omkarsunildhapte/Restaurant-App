import { Tabs } from '@layout/tabs/tabs';
import { NAV_ITEMS } from '@constants/navigation.constants';
import { renderPage } from '@testing/test-providers';

describe('Tabs', () => {
  it('renders one tab button per nav item', async () => {
    const { element } = await renderPage(Tabs);
    const buttons = element.querySelectorAll('ion-tab-button');
    expect(buttons.length).toBe(NAV_ITEMS.length);
    expect(element.textContent).toContain('Table Booking');
  });

  it('derives tab names from the nav paths', async () => {
    const { fixture } = await renderPage(Tabs);
    expect(fixture.componentInstance.items.map((i) => i.tab)).toEqual(['home', 'foods', 'table', 'add-cart', 'account']);
  });
});
