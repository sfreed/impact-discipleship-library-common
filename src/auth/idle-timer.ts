// Framework-agnostic inactivity timer shared between the reader and manager
// apps - deliberately plain TS (no Angular DI) so it's trivial to unit test
// and doesn't need an abstract-base/injection-token dance to work across two
// apps that each have their own, separate AuthService class. Each app wraps
// one of these in a small root-provided service that knows how to actually
// log its own user out (see each app's core/services/idle-timeout.service.ts).

export interface IdleTimerOptions {
  /** Total inactivity duration before onTimeout fires, in ms. */
  idleMs: number;
  /** How long before idleMs to fire onWarning, in ms (e.g. 5 minutes). */
  warningMs: number;
  onWarning: () => void;
  /** Fired when activity resumes after onWarning already fired, so the
   *  caller can dismiss whatever "still there?" UI it showed. Not called
   *  for the initial activity that keeps the timer from ever warning. */
  onResume: () => void;
  onTimeout: () => void;
  /** How often to check elapsed idle time, in ms. Default 15s - frequent
   *  enough for a responsive warning/countdown without checking on every
   *  single mousemove event. */
  checkIntervalMs?: number;
}

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'wheel', 'scroll', 'touchstart'] as const;

/** Tracks wall-clock time since the last user activity event and fires
 *  onWarning/onTimeout as thresholds are crossed. Call start() once a user
 *  is signed in and stop() once they're not (or already logged out) -
 *  it never calls logout/navigation itself, only the provided callbacks. */
export class IdleTimer {
  private lastActivityAt = Date.now();
  private warningShown = false;
  private intervalId: ReturnType<typeof setInterval> | undefined;
  private readonly onActivity = () => {
    this.lastActivityAt = Date.now();
    if (this.warningShown) {
      this.warningShown = false;
      this.options.onResume();
    }
  };

  constructor(private readonly options: IdleTimerOptions) {}

  start(): void {
    this.lastActivityAt = Date.now();
    this.warningShown = false;
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, this.onActivity, { passive: true });
    }
    this.intervalId = setInterval(() => this.check(), this.options.checkIntervalMs ?? 15000);
  }

  stop(): void {
    for (const event of ACTIVITY_EVENTS) {
      window.removeEventListener(event, this.onActivity);
    }
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.warningShown = false;
  }

  /** Explicitly counts as fresh activity - e.g. a "Stay signed in" button
   *  click, which (being inside a modal) may not otherwise reach the normal
   *  window-level activity listeners depending on how the dialog is mounted. */
  resetActivity(): void {
    this.onActivity();
  }

  private check(): void {
    const idleForMs = Date.now() - this.lastActivityAt;
    if (idleForMs >= this.options.idleMs) {
      this.stop();
      this.options.onTimeout();
      return;
    }
    if (!this.warningShown && idleForMs >= this.options.idleMs - this.options.warningMs) {
      this.warningShown = true;
      this.options.onWarning();
    }
  }
}
