import { PaymentMethods } from '@pages/payment-methods/payment-methods';
import { renderPage } from '@testing/test-providers';

describe('PaymentMethods', () => {
  it('renders its title', async () => {
    const { element } = await renderPage(PaymentMethods);
    expect(element.textContent).toContain('Payment-Methods');
  });
});
