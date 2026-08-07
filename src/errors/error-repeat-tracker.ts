// Pure repeat/suppression bookkeeping for BaseErrorLogHandler - decides,
// per error signature, whether an occurrence should write a fresh errorLogs
// doc or be folded into an already-logged "episode" (recorded on the first
// doc as repeatCount + lastOccurredAt, i.e. "recurred N times, started at
// `timestamp`, last seen at `lastOccurredAt`"). Framework-free and
// clock-injected so it's directly unit-testable (see
// error-repeat-tracker.spec.ts); timers and Firestore writes stay in
// BaseErrorLogHandler.

/** A repeat within this window of the previous occurrence continues the
 *  episode; a longer quiet gap starts a fresh errorLogs entry. */
export const EPISODE_GAP_MS = 10 * 60 * 1000;

/** Recurrence updates to the first doc are throttled to at most one write
 *  per this interval - the whole point is not hammering Firestore while an
 *  error is hammering us. */
export const FLUSH_INTERVAL_MS = 30 * 1000;

interface Episode {
  /** The errorLogs doc id of the episode's first occurrence - unset while
   *  that first write is still in flight (repeats arriving meanwhile are
   *  suppressed and flushed as soon as the id lands). */
  entryId?: string;
  count: number;
  lastOccurredAt: number;
  lastFlushedCount: number;
  lastFlushAt: number;
}

export type OccurrenceDecision = { kind: 'new' } | { kind: 'repeat'; flushDue: boolean };

export class ErrorRepeatTracker {
  private readonly episodes = new Map<string, Episode>();

  constructor(
    private readonly gapMs: number = EPISODE_GAP_MS,
    private readonly flushIntervalMs: number = FLUSH_INTERVAL_MS,
  ) {}

  /** Records one occurrence of `key` at `now` and says what the caller
   *  should do: write a fresh entry, or suppress (optionally flushing the
   *  recurrence note now, when the throttle interval has elapsed). */
  occurrence(key: string, now: number): OccurrenceDecision {
    this.prune(now);
    const episode = this.episodes.get(key);
    if (!episode || now - episode.lastOccurredAt > this.gapMs) {
      this.episodes.set(key, { count: 1, lastOccurredAt: now, lastFlushedCount: 1, lastFlushAt: now });
      return { kind: 'new' };
    }
    episode.count++;
    episode.lastOccurredAt = now;
    return { kind: 'repeat', flushDue: !!episode.entryId && now - episode.lastFlushAt >= this.flushIntervalMs };
  }

  /** Attaches the Firestore doc id once the episode's first write resolves. */
  setEntryId(key: string, entryId: string): void {
    const episode = this.episodes.get(key);
    if (episode) {
      episode.entryId = entryId;
    }
  }

  /** Forgets an episode - called when its first write FAILED, so the next
   *  occurrence retries a fresh write instead of being suppressed against a
   *  doc that never existed. */
  discard(key: string): void {
    this.episodes.delete(key);
  }

  /** The recurrence update due for `key`, marking it flushed - or undefined
   *  when there's nothing new to write (no episode, first write still in
   *  flight, or no occurrences since the last flush). */
  takeFlushPayload(key: string, now: number): { entryId: string; repeatCount: number; lastOccurredAt: number } | undefined {
    const episode = this.episodes.get(key);
    if (!episode?.entryId || episode.count === episode.lastFlushedCount) {
      return undefined;
    }
    episode.lastFlushedCount = episode.count;
    episode.lastFlushAt = now;
    return { entryId: episode.entryId, repeatCount: episode.count, lastOccurredAt: episode.lastOccurredAt };
  }

  private prune(now: number): void {
    for (const [key, episode] of this.episodes) {
      if (now - episode.lastOccurredAt > this.gapMs) {
        this.episodes.delete(key);
      }
    }
  }
}
