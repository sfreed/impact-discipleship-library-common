// Shared error-log shape - both impact-discipleship-library-new (reader,
// patron-facing) and impact-discipleship-library-manager-new (staff-facing,
// plus its own Cloud Functions) write to the same `errorLogs` collection;
// only the manager app's root-only Error Logs screen ever reads it back. See
// BaseErrorLogHandler (errors/base-error-log-handler.ts) for the shared
// write-time logic and firestore.rules for the read/write gating.

export type ErrorLogSource = 'reader' | 'manager' | 'functions';

export interface ErrorLogEntry {
  id: string;
  /** epoch ms, Date.now() - same convention as ActivityLogEntry. */
  timestamp: number;
  app: ErrorLogSource;
  /** null only for the pre-auth login/signup-failure path (see
   *  BaseErrorLogHandler.logPreAuthFailure) - there is no signed-in identity
   *  yet to attribute the entry to. */
  uid: string | null;
  /** The signed-in user's email, or the attempted email for a pre-auth
   *  login/signup-failure entry. */
  userEmail: string | null;
  userName: string | null;
  /** 'Component.methodName' for a manually-logged catch site, the current
   *  router URL for an automatically-caught (global ErrorHandler) error, a
   *  Cloud Function's own name for a functions-sourced entry, or 'login'/
   *  'signup' for a pre-auth failure. */
  location: string;
  message: string;
  /** Optional extra context beyond the raw error message - what operation
   *  was being attempted, or (for a Cloud Functions HttpsError) its code. */
  detail?: string;
  stack?: string;
  /** Ties this entry to other entries from the same user action - see
   *  errors/correlation-id.ts. Populated for manager-app Cloud Function
   *  calls and for the reader app's PayPal checkout flow; absent otherwise. */
  correlationId?: string;
  /** Repeat suppression (see BaseErrorLogHandler/ErrorRepeatTracker):
   *  when the same location+message recurs rapidly, no new entries are
   *  written - this first entry is updated instead. Total occurrences
   *  including the first; present only once a repeat happened (>= 2). The
   *  episode "started at" is this entry's own `timestamp`. */
  repeatCount?: number;
  /** epoch ms of the episode's most recent occurrence - the "ended at"
   *  side of the recurrence note. Present only alongside repeatCount. */
  lastOccurredAt?: number;
}

export type NewErrorLogEntry = Omit<ErrorLogEntry, 'id'>;
