/**
 * Combines a calendar date (only its year/month/day are used - any time
 * component on `date` is ignored) with a "HH:mm" wall-clock time string,
 * interpreted in `ianaZone`, into the precise UTC epoch ms instant that
 * represents. Framework-free, no date-library dependency - uses
 * Intl.DateTimeFormat to measure `ianaZone`'s UTC offset AT roughly that
 * instant (offsets shift with DST, so this can't be a fixed lookup table),
 * then corrects for it.
 *
 * Single-pass, not iterative: accurate everywhere except the ~1-hour window
 * during an actual DST transition, where the offset used to correct isn't
 * quite the offset that will really apply. Acceptable for a "potential
 * start date/time," not worth the added complexity of an iterative
 * refinement for that one edge case.
 */
export function combineDateTimeInZone(date: Date, timeString: string, ianaZone: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  const asIfUtcMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
  return asIfUtcMs + zoneOffsetMsAt(asIfUtcMs, ianaZone);
}

/** UTC-minus-local offset (ms) `ianaZone` observes at the instant `utcMs` -
 *  positive west of UTC (e.g. US Eastern is +14400000 in winter, +10800000
 *  in summer), matching `combineDateTimeInZone`'s subtraction above. */
function zoneOffsetMsAt(utcMs: number, ianaZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ianaZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asLocalReadAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return utcMs - asLocalReadAsUtc;
}

/** Inverse of the time-string half of combineDateTimeInZone - extracts the
 *  "HH:mm" wall-clock time `epochMs` corresponds to when read in `ianaZone`,
 *  for prefilling the wizard's time field when editing/cloning an existing
 *  group. */
export function extractTimeInZone(epochMs: number, ianaZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ianaZone,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(epochMs));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('hour')}:${get('minute')}`;
}

/** Formatter cache for formatGroupDateTime, keyed by IANA zone. Both apps
 *  call that function from methods invoked in templates (one call per group
 *  row per change-detection cycle), and constructing an Intl.DateTimeFormat
 *  is by far the expensive part of a format - caching per zone (the only
 *  varying option) makes the per-cycle cost a Map lookup plus a cheap
 *  format() call. Unbounded but naturally tiny: it can only ever hold the
 *  zones of groups actually on screen, drawn from the curated TIME_ZONES
 *  list plus device-zone fallbacks. */
const groupDateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

/** Formats an epoch instant for display in a specific IANA zone (e.g.
 *  "Jul 15, 2026, 7:00 PM EDT") - the easy direction, since it's just asking
 *  Intl to render an already-known instant, not solve for one. Built from
 *  individual component options rather than dateStyle/timeStyle - per spec,
 *  those two can't be combined with timeZoneName in the same formatter. */
export function formatGroupDateTime(epochMs: number, ianaZone: string): string {
  let formatter = groupDateTimeFormatters.get(ianaZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    groupDateTimeFormatters.set(ianaZone, formatter);
  }
  return formatter.format(new Date(epochMs));
}

/** formatGroupDateTime, but falling back to the VIEWER's own device time zone
 *  for legacy groups saved before startTimeZone existed. Centralizes the
 *  `deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone` + fallback
 *  wrapper that six reader components each restated per screen. The device
 *  zone is resolved per call (cheap, and the viewer's zone can't change
 *  mid-session in practice); the underlying per-zone formatter cache still
 *  keys on the resolved zone string. */
export function formatGroupDateTimeForViewer(epochMs: number, ianaZone?: string): string {
  return formatGroupDateTime(
    epochMs,
    ianaZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
}
