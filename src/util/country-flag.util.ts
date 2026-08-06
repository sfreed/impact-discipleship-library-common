/**
 * The flag emoji for an ISO 3166-1 alpha-2 country code ('US' -> the US
 * flag), built from Unicode regional-indicator pairs - no image assets.
 * Empty string for a missing/malformed code (e.g. a LibraryUserLocation
 * recorded before countryCode existed), so callers can always prepend the
 * result to a place label unconditionally.
 *
 * Shared between the reader app (Settings page's sign-in location row) and
 * the manager app (Patrons screen's location column).
 */
export function countryFlagEmoji(code: string | undefined): string {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) {
    return '';
  }
  const upper = code.toUpperCase();
  const REGIONAL_INDICATOR_A = 0x1f1e6;
  return String.fromCodePoint(
    REGIONAL_INDICATOR_A + upper.charCodeAt(0) - 65,
    REGIONAL_INDICATOR_A + upper.charCodeAt(1) - 65,
  );
}
