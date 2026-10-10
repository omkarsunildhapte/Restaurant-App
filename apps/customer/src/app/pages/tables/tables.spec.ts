import { Tables } from '@pages/tables/tables';
import { TableService } from '@services/table/table.service';
import { TABLE } from '@testing/fixtures';
import { renderPage, settle } from '@testing/test-providers';

vi.mock('swiper', () => ({ default: vi.fn() }));

describe('Tables', () => {
  it('shows an empty state with no tables', async () => {
    const { fixture, element } = await renderPage(Tables);
    await settle(fixture);
    expect(element.textContent).toContain('No tables to book yet.');
  });

  it('links each table to its booking screen', async () => {
    const { fixture, element } = await renderPage(Tables, { providers: [{ provide: TableService, useValue: { listTables: () => Promise.resolve([TABLE]) } }] });
    await settle(fixture);
    expect(element.textContent).toContain('Window Table');
    expect(element.querySelector('a[href*="table-details"]')?.getAttribute('href')).toBe('/main/table-details?id=t1');
  });
});
