import type { Request, Response } from 'express';
import { z } from 'zod';
import { errorMiddleware } from '@middleware/error.middleware.js';
import { AppError, ConfigError } from '@utils/app-error.utils.js';

function run(err: unknown) {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  errorMiddleware(err, {} as Request, res as unknown as Response, vi.fn());
  return { status: res.status.mock.calls[0]?.[0], body: res.json.mock.calls[0]?.[0] };
}

describe('errorMiddleware', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends an AppError with its status and code', () => {
    expect(run(AppError.notFound('Restaurant not found'))).toEqual({
      status: 404,
      body: { error: 'Restaurant not found', errorCode: 'NOT_FOUND' },
    });
  });

  it('lists every invalid field of a zod error', () => {
    const parsed = z.object({ name: z.string().min(2), slug: z.string().regex(/^[a-z]+$/) }).safeParse({ name: 'X', slug: 'Bad Slug' });
    const { status, body } = run(parsed.error);
    expect(status).toBe(400);
    expect(body.errorCode).toBe('VALIDATION_ERROR');
    expect(body.error).toMatch(/^name: .*; slug: /);
  });

  it('reports a missing key as 503, not as a user error', () => {
    expect(run(new ConfigError('API is not configured: set SUPABASE_ANON_KEY in backend/.env')).status).toBe(503);
  });

  it('hides unexpected errors behind a generic 500', () => {
    expect(run(new TypeError('cannot read x of undefined'))).toEqual({
      status: 500,
      body: { error: 'Something went wrong', errorCode: 'INTERNAL_ERROR' },
    });
  });
});
