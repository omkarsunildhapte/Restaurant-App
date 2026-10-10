import { Account } from '@pages/account/account';
import { ACCOUNT_MENU } from '@constants/navigation.constants';
import { renderPage, settle } from '@testing/test-providers';

describe('Account', () => {
  it('shows the customer name and the account menus as links', async () => {
    const { fixture, element } = await renderPage(Account);
    await settle(fixture);
    expect(element.textContent).toContain('Test User');
    expect(fixture.componentInstance.initial()).toBe('T');
    expect(element.querySelectorAll('ion-item').length).toBe(ACCOUNT_MENU.GENERAL.length + ACCOUNT_MENU.MORE.length);
    expect(element.textContent).toContain('Account information');
  });
});
