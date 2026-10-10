import { Injectable, inject } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseClientService } from '../../core/supabase.client';
import type { Database, Tables } from './database.types';

export type Db = SupabaseClient<Database>;
export type { Tables };

export type TenantRole = Database['public']['Enums']['tenant_role'];
export type TenantStatus = Database['public']['Enums']['tenant_status'];
export type DietType = Database['public']['Enums']['diet_type'];
export type ItemKind = Database['public']['Enums']['item_kind'];

/** A database refusal turned into a sentence for the person using the screen. */
export class DbError extends Error {
  constructor(
    message: string,
    readonly code: string | undefined,
  ) {
    super(message);
    this.name = 'DbError';
  }
}

interface PgError {
  code?: string;
  message: string;
  details?: string | null;
}

/** Our own SQL functions already raise readable messages (P0001, 22023, 42501 from RLS helpers). */
function friendly(error: PgError): string {
  switch (error.code) {
    case '42501':
      return error.message.startsWith('new row violates row-level security')
        ? 'You do not have permission to do that.'
        : error.message;
    case '23505':
      return 'That name is already used. Pick a different one.';
    case '23503':
      return 'This is still in use elsewhere, so it cannot be removed. Remove what uses it first.';
    case '23514':
      return 'Some values are not allowed. Check the form and try again.';
    case 'PGRST116':
      return 'Not found, or you do not have access to it.';
    default:
      return error.message;
  }
}

/**
 * Returns data or throws a DbError with a readable message. Typed non-null: selects, inserts
 * with .select() and .single() return a value on success; for plain update/delete the value is
 * null and callers ignore it.
 */
export function unwrap<T>(result: { data: T; error: PgError | null }): NonNullable<T> {
  if (result.error) throw new DbError(friendly(result.error), result.error.code);
  return result.data as NonNullable<T>;
}

export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

/** The typed Supabase client for the Business panel (browser only). */
@Injectable({ providedIn: 'root' })
export class BusinessDb {
  private readonly supabase = inject(SupabaseClientService);

  get client(): Db {
    return this.supabase.requireClient() as unknown as Db;
  }

  get available(): boolean {
    return this.supabase.client !== null;
  }
}
