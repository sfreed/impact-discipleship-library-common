export interface TimeZoneOption {
  /** IANA time zone identifier, e.g. "America/New_York" - what's actually
   *  stored on DiscussionGroup.startTimeZone and passed to Intl.DateTimeFormat. */
  id: string;
  label: string;
}

/** Curated list biased toward the US (this app's primary audience - see
 *  US_STATES/COUNTRIES' own similar curation) plus a handful of other common
 *  zones, rather than the full ~400-entry IANA tzdata list. Each entry names
 *  a real IANA zone (not a fixed UTC offset) specifically so DST is handled
 *  correctly by Intl.DateTimeFormat year-round. */
export const TIME_ZONES: TimeZoneOption[] = [
  { id: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { id: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { id: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { id: 'America/Denver', label: 'Mountain Time (MT)' },
  { id: 'America/Phoenix', label: 'Arizona Time (no DST)' },
  { id: 'America/Chicago', label: 'Central Time (CT)' },
  { id: 'America/New_York', label: 'Eastern Time (ET)' },
  { id: 'America/Puerto_Rico', label: 'Atlantic Time (AST, no DST)' },
  { id: 'Europe/London', label: 'London (GMT/BST)' },
  { id: 'Europe/Paris', label: 'Central Europe (CET/CEST)' },
  { id: 'UTC', label: 'UTC' },
];

/** Falls back to the raw id itself if it's not in the curated list above
 *  (e.g. a browser auto-detected a zone this list doesn't happen to name) -
 *  same "never show a blank" reasoning as usStateNameByCode. */
export function timeZoneLabel(id: string): string {
  return TIME_ZONES.find((tz) => tz.id === id)?.label ?? id;
}
