// Ties together related error-log entries from one user action - e.g. a
// manager-app client call and the Cloud Function it invoked, or a reader-app
// PayPal checkout and any later refund of that same purchase. See
// ErrorLogEntry.correlationId and base-error-log-handler.ts.

/** Same crypto.randomUUID() pattern already used for highlight ids in the
 *  reader app. */
export function newCorrelationId(): string {
  return crypto.randomUUID();
}

/** Stashes a correlation id on a caught error object so it can travel from
 *  wherever a Cloud-Function-calling service method catches it back up to
 *  whatever component eventually calls errorLog.logError(). */
export function attachCorrelationId(error: unknown, correlationId: string): unknown {
  if (error && typeof error === 'object') {
    (error as Record<string, unknown>)['correlationId'] = correlationId;
  }
  return error;
}

export function readCorrelationId(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'correlationId' in error) {
    return (error as Record<string, unknown>)['correlationId'] as string;
  }
  return undefined;
}
