import { combineDateTimeInZone, extractTimeInZone, formatGroupDateTime } from './group-datetime.util';

describe('combineDateTimeInZone', () => {
  it('combines a summer (DST) date/time in US Eastern into the correct UTC instant', () => {
    const result = combineDateTimeInZone(new Date(2026, 6, 15), '19:00', 'America/New_York');
    expect(result).toBe(Date.UTC(2026, 6, 15, 23, 0, 0)); // 7pm EDT (UTC-4) == 11pm UTC
  });

  it('combines a winter (standard time) date/time in US Eastern into the correct UTC instant', () => {
    const result = combineDateTimeInZone(new Date(2026, 0, 15), '19:00', 'America/New_York');
    expect(result).toBe(Date.UTC(2026, 0, 16, 0, 0, 0)); // 7pm EST (UTC-5) == midnight UTC next day
  });

  it('handles a zone with no DST (Arizona)', () => {
    const result = combineDateTimeInZone(new Date(2026, 6, 15), '19:00', 'America/Phoenix');
    expect(result).toBe(Date.UTC(2026, 6, 16, 2, 0, 0)); // 7pm MST (UTC-7) year-round == 2am UTC next day
  });

  it('round-trips through formatGroupDateTime back to the intended wall-clock time', () => {
    const epochMs = combineDateTimeInZone(new Date(2026, 6, 15), '19:00', 'America/New_York');
    expect(formatGroupDateTime(epochMs, 'America/New_York')).toBe('Jul 15, 2026, 7:00 PM EDT');
  });
});

describe('extractTimeInZone', () => {
  it('is the inverse of combineDateTimeInZone for the same zone', () => {
    const epochMs = combineDateTimeInZone(new Date(2026, 6, 15), '19:00', 'America/New_York');
    expect(extractTimeInZone(epochMs, 'America/New_York')).toBe('19:00');
  });

  it('reads a different wall-clock time in a different zone for the same instant', () => {
    const epochMs = Date.UTC(2026, 6, 15, 23, 0, 0);
    expect(extractTimeInZone(epochMs, 'America/New_York')).toBe('19:00');
    expect(extractTimeInZone(epochMs, 'America/Chicago')).toBe('18:00');
  });
});

describe('formatGroupDateTime', () => {
  it('renders the same instant differently in different zones', () => {
    const epochMs = Date.UTC(2026, 6, 15, 23, 0, 0);
    expect(formatGroupDateTime(epochMs, 'America/New_York')).toBe('Jul 15, 2026, 7:00 PM EDT');
    expect(formatGroupDateTime(epochMs, 'America/Chicago')).toBe('Jul 15, 2026, 6:00 PM CDT');
    expect(formatGroupDateTime(epochMs, 'UTC')).toBe('Jul 15, 2026, 11:00 PM UTC');
  });
});
