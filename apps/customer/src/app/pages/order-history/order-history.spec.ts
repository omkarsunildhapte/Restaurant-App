import { OrderHistory } from '@pages/order-history/order-history';
import { renderPage } from '@testing/test-providers';

describe('OrderHistory', () => {
  it('starts on the order segment and switches to tables', async () => {
    const { fixture, element } = await renderPage(OrderHistory);
    expect(element.textContent).toContain('Starbucks');
    fixture.componentInstance.onSegmentChange(new CustomEvent('ionChange', { detail: { value: 'table' } }));
    await fixture.whenStable();
    expect(fixture.componentInstance.segment()).toBe('table');
    expect(element.textContent).not.toContain('Starbucks');
  });
});
