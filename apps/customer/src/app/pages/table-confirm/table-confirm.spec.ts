import { TableConfirm } from '@pages/table-confirm/table-confirm';
import { TableService } from '@services/table/table.service';
import { BOOKING } from '@testing/fixtures';
import { renderPage, settle } from '@testing/test-providers';

describe('TableConfirm', () => {
  it('says there is no booking yet', async () => {
    const { fixture, element } = await renderPage(TableConfirm);
    await settle(fixture);
    expect(element.textContent).toContain('No booking to show yet.');
  });

  it('shows the latest booking', async () => {
    const { fixture, element } = await renderPage(TableConfirm, { providers: [{ provide: TableService, useValue: { listBookings: () => Promise.resolve([BOOKING]) } }] });
    await settle(fixture);
    expect(element.textContent).toContain('Thank You!');
    expect(element.textContent).toContain('Asha');
    expect(element.textContent).toContain('2030-05-01(19:30)');
  });
});
