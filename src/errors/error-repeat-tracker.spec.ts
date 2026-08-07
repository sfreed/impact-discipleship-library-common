import { ErrorRepeatTracker } from './error-repeat-tracker';

const GAP = 10 * 60 * 1000;
const FLUSH = 30 * 1000;
const T0 = 1_000_000;

describe('ErrorRepeatTracker', () => {
  let tracker: ErrorRepeatTracker;

  beforeEach(() => {
    tracker = new ErrorRepeatTracker(GAP, FLUSH);
  });

  it('first occurrence of a key is new', () => {
    expect(tracker.occurrence('a', T0)).toEqual({ kind: 'new' });
  });

  it('a rapid repeat is suppressed without a flush before the throttle interval', () => {
    tracker.occurrence('a', T0);
    tracker.setEntryId('a', 'doc1');
    expect(tracker.occurrence('a', T0 + 1000)).toEqual({ kind: 'repeat', flushDue: false });
  });

  it('a repeat after the throttle interval is flush-due, and the payload carries count + last time', () => {
    tracker.occurrence('a', T0);
    tracker.setEntryId('a', 'doc1');
    tracker.occurrence('a', T0 + 1000);
    const decision = tracker.occurrence('a', T0 + FLUSH + 1);
    expect(decision).toEqual({ kind: 'repeat', flushDue: true });
    expect(tracker.takeFlushPayload('a', T0 + FLUSH + 1)).toEqual({
      entryId: 'doc1',
      repeatCount: 3,
      lastOccurredAt: T0 + FLUSH + 1,
    });
  });

  it('takeFlushPayload is undefined when nothing new happened since the last flush', () => {
    tracker.occurrence('a', T0);
    tracker.setEntryId('a', 'doc1');
    tracker.occurrence('a', T0 + 1000);
    expect(tracker.takeFlushPayload('a', T0 + 2000)).toBeDefined();
    expect(tracker.takeFlushPayload('a', T0 + 3000)).toBeUndefined();
  });

  it('repeats are never flush-due while the first write is still in flight (no entry id yet)', () => {
    tracker.occurrence('a', T0);
    expect(tracker.occurrence('a', T0 + FLUSH + 1)).toEqual({ kind: 'repeat', flushDue: false });
    expect(tracker.takeFlushPayload('a', T0 + FLUSH + 2)).toBeUndefined();
    tracker.setEntryId('a', 'doc1');
    expect(tracker.takeFlushPayload('a', T0 + FLUSH + 3)).toEqual({
      entryId: 'doc1',
      repeatCount: 2,
      lastOccurredAt: T0 + FLUSH + 1,
    });
  });

  it('a repeat after the quiet gap starts a fresh episode', () => {
    tracker.occurrence('a', T0);
    tracker.setEntryId('a', 'doc1');
    tracker.occurrence('a', T0 + 1000);
    expect(tracker.occurrence('a', T0 + 1000 + GAP + 1)).toEqual({ kind: 'new' });
    // The old episode is gone - no stale flush against doc1.
    expect(tracker.takeFlushPayload('a', T0 + 1000 + GAP + 2)).toBeUndefined();
  });

  it('different keys track independent episodes', () => {
    tracker.occurrence('a', T0);
    expect(tracker.occurrence('b', T0 + 1)).toEqual({ kind: 'new' });
    expect(tracker.occurrence('a', T0 + 2)).toEqual({ kind: 'repeat', flushDue: false });
  });

  it('discard forgets the episode so the next occurrence retries a fresh write', () => {
    tracker.occurrence('a', T0);
    tracker.discard('a');
    expect(tracker.occurrence('a', T0 + 1000)).toEqual({ kind: 'new' });
  });
});
