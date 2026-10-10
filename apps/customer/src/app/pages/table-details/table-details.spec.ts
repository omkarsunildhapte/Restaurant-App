import { TableDetails } from '@pages/table-details/table-details';
import { TableService } from '@services/table/table.service';
import { TABLE } from '@testing/fixtures';
import { renderPage, settle } from '@testing/test-providers';

describe('TableDetails', () => {
  async function open() {
    const page = await renderPage(TableDetails, { providers: [{ provide: TableService, useValue: { getTable: () => Promise.resolve(TABLE), bookTable: vi.fn().mockRejectedValue(new Error('x')) } }] });
    page.fixture.componentRef.setInput('id', 't1');
    await settle(page.fixture);
    return page;
  }

  it('shows the table and requires the booking fields', async () => {
    const { fixture, element } = await open();
    expect(element.textContent).toContain('Window Table');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(element.textContent).toContain('Guests must be at least 1');
    expect(element.textContent).toContain('Date is required');
  });

  it('builds time slots for the picked date and books', async () => {
    const { fixture, element, ui } = await open();
    const page = fixture.componentInstance;
    page.changeGuests(1);
    page.onDateChange(new CustomEvent('ionChange', { detail: { value: '2030-05-01T00:00:00' } }));
    expect(page.bookingForm.date().value()).toBe('2030-05-01');
    expect(page.slots()[0]).toBe('00:00');
    page.pickTime('19:30');
    page.bookingForm.firstName().value.set('Asha');
    page.bookingForm.lastName().value.set('Rao');
    page.bookingForm.email().value.set('asha@example.com');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(ui.toast.notConnected).toHaveBeenCalled();
  });
});
