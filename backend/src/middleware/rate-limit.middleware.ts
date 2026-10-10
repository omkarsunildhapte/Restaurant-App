import type { NextFunction, Request, Response } from 'express';
import { ErrorCodes, HttpStatus } from '@type/utils/app-error.enum.js';
import { AppError } from '@utils/app-error.utils.js';

/**
 * Fixed-window limit per client IP, in memory. Enough for one API process; with several
 * processes behind a balancer this moves to a shared store (and `trust proxy` must be set so
 * req.ip is the visitor, not the balancer).
 */
export function rateLimit(options: { windowMs: number; max: number; message: string }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, _res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = req.ip ?? 'unknown';
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + options.windowMs };
      hits.set(key, entry);
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      }
    }
    entry.count++;
    if (entry.count > options.max) {
      throw new AppError(options.message, HttpStatus.TOO_MANY_REQUESTS, ErrorCodes.RATE_LIMITED);
    }
    next();
  };
}

/** Sign-ups: 5 per IP per hour. */
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many sign-ups from this connection. Try again in an hour, or call us.',
});
