import { ErrorHandler, Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorLogSource, NewErrorLogEntry } from '../models/error-log.model';
import { readCorrelationId } from './correlation-id';
import { ErrorRepeatTracker, FLUSH_INTERVAL_MS } from './error-repeat-tracker';

/**
 * Shared error-logging core, registered as each app's global ErrorHandler
 * AND directly injectable for manual catch-site calls (see each app's own
 * ErrorLogService subclass and its `{ provide: ErrorHandler, useExisting:
 * ErrorLogService }` provider - must be useExisting, not useClass, so both
 * roles resolve to the exact same singleton instance).
 *
 * Same "concrete shared logic + abstract per-app hooks" pattern as
 * theme/base-theme.service.ts's BaseThemeService (not auth/idle-timer.ts's
 * framework-agnostic pattern - this class needs Angular DI throughout).
 */
export abstract class BaseErrorLogHandler implements ErrorHandler {
  private readonly injector = inject(Injector);

  // Repeat suppression: when the same location+message recurs within
  // ErrorRepeatTracker's quiet-gap window, no new errorLogs docs are
  // written - the episode's FIRST doc is updated (throttled) with
  // repeatCount + lastOccurredAt instead, so a hammering error produces one
  // entry reading "recurred N times, started at `timestamp`, last seen at
  // `lastOccurredAt`" rather than hundreds of rows. In-memory and
  // per-session by design: two users (or two tabs) hitting the same error
  // each write their own episode entry, which is exactly the right
  // attribution anyway. The pre-auth path below is deliberately NOT
  // suppressed - those are human-paced login/signup retries, and the
  // update rule requires a signed-in matching uid.
  private readonly repeatTracker = new ErrorRepeatTracker();
  private readonly trailingFlushTimers = new Map<string, ReturnType<typeof setTimeout>>();

  protected abstract readonly source: ErrorLogSource;
  protected abstract getIdentity(): { uid: string | null; email: string | null; name: string | null };
  /** Writes a fresh entry and returns its doc id (for recurrence updates). */
  protected abstract writeEntry(entry: NewErrorLogEntry): Promise<string>;
  /** Updates an episode's first entry with its recurrence note - the only
   *  mutation firestore.rules permits on an errorLogs doc. */
  protected abstract updateEntryRecurrence(
    entryId: string,
    changes: { repeatCount: number; lastOccurredAt: number },
  ): Promise<void>;

  /** Angular's global error hook (window.onerror/unhandledrejection, via
   *  provideBrowserGlobalErrorListeners(), and any error Angular itself
   *  catches during change detection) - anything that reaches here was
   *  never explicitly caught anywhere else in the app. */
  handleError(error: unknown): void {
    console.error(error);
    // Router is resolved lazily, ONLY here (not in the constructor / a field
    // initializer) - a custom ErrorHandler can be constructed very early in
    // bootstrap, before Router's own providers are guaranteed resolvable;
    // injecting Router eagerly is a known Angular footgun. By the time a
    // real error actually occurs, bootstrap has long since finished, so
    // this lazy get() is always safe.
    const location = this.injector.get(Router).url;
    void this.record(location, error, undefined, undefined);
  }

  /** Manual call site, e.g. `this.errorLog.logError('Component.method', err)`
   *  from an existing catch block. `correlationId` is read off the error
   *  itself (see correlation-id.ts) if not passed explicitly. */
  logError(location: string, error: unknown, detail?: string, correlationId?: string): Promise<void> {
    return this.record(location, error, detail, correlationId ?? readCorrelationId(error));
  }

  /** The one path allowed to write with uid: null - a failed login/signup/
   *  forgot-password attempt, before any signed-in identity exists (see
   *  firestore.rules' narrow unauthenticated-write exception for this exact
   *  shape). Unconditional for login/signup - no expected-vs-abnormal
   *  filtering, since the whole point is visibility into every login
   *  struggle, not just "real bugs." Callers logging a forgotPassword
   *  failure are expected to filter out the anticipated `user-not-found`
   *  case themselves before calling this (see LoginComponent.sendResetEmail)
   *  - that one *is* an expected/anticipated condition, unlike a real login
   *  failure. */
  async logPreAuthFailure(
    location: 'login' | 'signup' | 'forgotPassword',
    attemptedEmail: string,
    error: unknown,
  ): Promise<void> {
    try {
      await this.writeEntry({
        timestamp: Date.now(),
        app: this.source,
        uid: null,
        userEmail: attemptedEmail || null,
        userName: null,
        location,
        message: error instanceof Error ? error.message : String(error),
        ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
      });
    } catch (loggingErr) {
      console.error('Failed to write pre-auth error log entry', loggingErr);
    }
  }

  private async record(
    location: string,
    error: unknown,
    detail: string | undefined,
    correlationId: string | undefined,
  ): Promise<void> {
    try {
      const identity = this.getIdentity();
      if (identity.uid === null) {
        return; // signed out outside the dedicated pre-auth path above - nothing to attribute this to
      }
      const message = error instanceof Error ? error.message : String(error);
      const key = `${location}\n${message}`;
      const decision = this.repeatTracker.occurrence(key, Date.now());
      if (decision.kind === 'repeat') {
        // Suppressed - fold into the episode's first doc. Flush now if the
        // throttle interval has elapsed, and (re)arm a trailing flush so the
        // final "ended at" lands shortly after the burst stops rather than
        // waiting for a next-occurrence that never comes.
        if (decision.flushDue) {
          await this.flushRecurrence(key);
        }
        this.scheduleTrailingFlush(key);
        return;
      }
      const entry: NewErrorLogEntry = {
        timestamp: Date.now(),
        app: this.source,
        uid: identity.uid,
        userEmail: identity.email,
        userName: identity.name,
        location,
        message,
        ...(detail ? { detail } : {}),
        ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
        ...(correlationId ? { correlationId } : {}),
      };
      try {
        const entryId = await this.writeEntry(entry);
        this.repeatTracker.setEntryId(key, entryId);
        // Repeats that arrived while the write above was in flight were
        // suppressed with nowhere to flush to - catch them up immediately.
        await this.flushRecurrence(key);
      } catch (writeErr) {
        // First write failed: forget the episode so the next occurrence
        // retries a fresh write instead of suppressing against nothing.
        this.repeatTracker.discard(key);
        throw writeErr;
      }
    } catch (loggingErr) {
      // A failure IN error logging must never throw again (no handler for
      // the handler) - degrade to console only.
      console.error('Failed to write error log entry', loggingErr);
    }
  }

  private async flushRecurrence(key: string): Promise<void> {
    const payload = this.repeatTracker.takeFlushPayload(key, Date.now());
    if (!payload) {
      return;
    }
    try {
      await this.updateEntryRecurrence(payload.entryId, {
        repeatCount: payload.repeatCount,
        lastOccurredAt: payload.lastOccurredAt,
      });
    } catch (updateErr) {
      // Same "never throw from the logger" posture as record() - a missed
      // recurrence update just leaves the count lower than reality.
      console.error('Failed to update error log recurrence', updateErr);
    }
  }

  private scheduleTrailingFlush(key: string): void {
    const existing = this.trailingFlushTimers.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    this.trailingFlushTimers.set(
      key,
      setTimeout(() => {
        this.trailingFlushTimers.delete(key);
        void this.flushRecurrence(key);
      }, FLUSH_INTERVAL_MS),
    );
  }
}
