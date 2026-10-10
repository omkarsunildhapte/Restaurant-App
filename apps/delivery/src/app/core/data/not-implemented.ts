/**
 * Thrown by the Phase 5 data stubs. Firestore was removed and the Supabase tables are not wired
 * yet, so every write rejects with this error and pages show a "Not connected yet" toast.
 */
export class NotImplementedError extends Error {
  constructor(operation: string) {
    super(`Not connected yet: ${operation}`);
    this.name = 'NotImplementedError';
  }
}

export function isNotImplemented(error: unknown): error is NotImplementedError {
  return error instanceof NotImplementedError;
}
