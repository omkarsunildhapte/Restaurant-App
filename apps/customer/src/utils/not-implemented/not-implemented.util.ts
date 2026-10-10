import { NOT_CONNECTED } from '@constants/messages.constants';

/** Thrown by data-service stubs whose backing Supabase table is not wired yet (Phase 8). */
export class NotImplementedError extends Error {
  constructor(operation: string) {
    super(NOT_CONNECTED.prefix(operation));
    this.name = NOT_CONNECTED.ERROR_NAME;
  }
}

/** A rejected promise for a stubbed write. */
export function notImplemented<T>(operation: string): Promise<T> {
  return Promise.reject(new NotImplementedError(operation));
}
