import { AccountInformation } from '@pages/account-information/account-information';
import { renderPage, settle } from '@testing/test-providers';

describe('AccountInformation', () => {
  it('prefills from the signed-in profile', async () => {
    const { fixture } = await renderPage(AccountInformation);
    await settle(fixture);
    const form = fixture.componentInstance.accountForm;
    expect(form.displayName().value()).toBe('Test User');
    expect(form.email().value()).toBe('test@example.com');
  });

  it('validates the phone and toasts "Not connected yet" on save', async () => {
    const { fixture, element, ui } = await renderPage(AccountInformation);
    await settle(fixture);
    const form = fixture.componentInstance.accountForm;
    form.phoneNumber().value.set('123');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(element.textContent).toContain('Phone Number must be 10 digits.');
    form.phoneNumber().value.set('9876543210');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(ui.toast.notConnected).toHaveBeenCalled();
  });
});
