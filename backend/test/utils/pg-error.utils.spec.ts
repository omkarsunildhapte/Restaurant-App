import { check } from '@utils/pg-error.utils.js';
import { AppError } from '@utils/app-error.utils.js';

describe('check', () => {
  it('returns the data of a successful call', () => {
    expect(check({ data: [1, 2], error: null })).toEqual([1, 2]);
  });

  it.each([
    ['42501', 403, 'FORBIDDEN'],
    ['22023', 400, 'VALIDATION_ERROR'],
    ['23505', 409, 'ALREADY_EXISTS'],
    ['23503', 400, 'VALIDATION_ERROR'],
    ['P0001', 400, 'BUSINESS_RULE'],
    ['P0002', 404, 'NOT_FOUND'],
    ['XX000', 500, 'INTERNAL_ERROR'],
  ])('maps Postgres %s to HTTP %i (%s), keeping the message', (code, status, errorCode) => {
    try {
      check({ data: null, error: { code, message: 'Only an owner or admin can invite staff' } });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect(e).toMatchObject({ statusCode: status, errorCode, message: 'Only an owner or admin can invite staff' });
    }
  });
});
