import { ErrorHandler, Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorLogSource, NewErrorLogEntry } from '../models/error-log.model';
import { readCorrelationId } from './correlation-id';

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

  protected abstract readonly source: ErrorLogSource;
  protected abstract getIdentity(): { uid: string | null; email: string | null; name: string | null };
  protected abstract writeEntry(entry: NewErrorLogEntry): Promise<void>;

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
      const entry: NewErrorLogEntry = {
        timestamp: Date.now(),
        app: this.source,
        uid: identity.uid,
        userEmail: identity.email,
        userName: identity.name,
        location,
        message: error instanceof Error ? error.message : String(error),
        ...(detail ? { detail } : {}),
        ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
        ...(correlationId ? { correlationId } : {}),
      };
      await this.writeEntry(entry);
    } catch (loggingErr) {
      // A failure IN error logging must never throw again (no handler for
      // the handler) - degrade to console only.
      console.error('Failed to write error log entry', loggingErr);
    }
  }
}
