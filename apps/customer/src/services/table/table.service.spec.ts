import { TestBed } from '@angular/core/testing';
import { TableBooking } from '@appTypes/table.types';
import { TableService } from '@services/table/table.service';
import { NotImplementedError } from '@utils/not-implemented/not-implemented.util';

describe('TableService (Phase 8 stubs)', () => {
  const service = () => TestBed.inject(TableService);

  it('reads resolve empty', async () => {
    await expect(service().listTables()).resolves.toEqual([]);
    await expect(service().getTable('1')).resolves.toBeNull();
    await expect(service().listBookings('u')).resolves.toEqual([]);
  });

  it('booking rejects with NotImplementedError', async () => {
    await expect(service().bookTable({} as TableBooking)).rejects.toBeInstanceOf(NotImplementedError);
  });
});
