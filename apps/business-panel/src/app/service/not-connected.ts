import { Observable, throwError } from 'rxjs';
import { ToastMessage } from '../shared/ui/toast.service';

/** Thrown by data-service stubs until Phase 1 wires them to Supabase. */
export class NotImplementedError extends Error {
  constructor(operation: string) {
    super(`Not connected yet: ${operation}`);
    this.name = 'NotImplementedError';
  }
}

export function notConnected<T>(operation: string): Observable<T> {
  return throwError(() => new NotImplementedError(operation));
}

/** Toast shown when a stubbed write is attempted. */
export const NOT_CONNECTED_TOAST: ToastMessage = {
  severity: 'info',
  summary: 'Not connected yet',
  detail: 'Saving is not available until the database is connected.',
};
