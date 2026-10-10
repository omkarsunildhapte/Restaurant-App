import type { NextFunction, Request, Response } from 'express';
import { adminClient, userClient } from '@config/supabase.config.js';
import { AppError } from '@utils/app-error.utils.js';
import { check } from '@utils/pg-error.utils.js';
import type { Caller } from '@type/express.js';

/** Requires a valid Supabase access token; attaches a user-scoped database client to the request. */
export async function requireUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) {
    throw AppError.unauthorized('Sign in first');
  }
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data.user) {
    throw AppError.unauthorized('Your session has expired. Sign in again.');
  }
  req.caller = { userId: data.user.id, email: data.user.email, db: userClient(token) };
  next();
}

/** After requireUser: only platform Super Admins (profiles.is_super_admin). */
export async function requireSuperAdmin(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const isSuper = check(await caller(req).db.rpc('am_i_super_admin'));
  if (!isSuper) {
    throw AppError.forbidden('Super Admin only');
  }
  next();
}

/** The caller set by requireUser; a programming error if a route forgot the guard. */
export function caller(req: Request): Caller {
  if (!req.caller) {
    throw new Error('requireUser must run before this handler');
  }
  return req.caller;
}
