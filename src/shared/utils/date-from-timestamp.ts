// Dependency-free (no date-fns) since the 2026-08-20 move into the shared
// submodule: every consuming app (web, admin, reader, and eventually
// functions) can compile this without installing anything. Behaviour is
// pinned by date-from-timestamp.spec.ts next to it.

// Normalizes the several shapes a "date" arrives in from Firestore - a real
// Date, a real Timestamp (via its `seconds`), a malformed plain
// {seconds, nanoseconds} map, or a string - into a Date, or null when it
// can't. Strings in the one legacy "MM/dd/yyyy" form parse; any other
// string is returned AS-IS (the caller decides - see toMillis below).
//
// Return type is deliberately `any`: that is the contract every caller in
// the web and admin apps was written against (the date-fns version inferred
// `any` too), with callers assigning the result straight into Date-typed
// fields. The honest type is `Date | string | null` - tightening it is a
// separate cleanup that touches ~20 call sites; prefer toMillis() for new
// code that just needs something sortable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dateFromTimestamp = (item): any => {
  if (!item) {
    return null;
  }

  if (item instanceof Date) {
    return item;
  }

  if (typeof item === 'string') {
    return parseStringDate(item);
  }

  let normalizedDate: Date | undefined;

  if (item?.seconds) {
    normalizedDate = new Date(Number(item.seconds) * 1000);
  }

  return isValidDate(normalizedDate) ? normalizedDate : null;
};

// Single canonical "give me a sortable number" helper - use this instead of
// a private per-component toMillis(). Delegates entirely to
// dateFromTimestamp() above, so it correctly handles a real Date, a date
// string, AND a raw Firestore Timestamp (including the {seconds,
// nanoseconds}-shaped map some documents have instead of a genuine
// Timestamp instance - see the comment on FirebaseDAO.streamAll() /
// purchases.dateProcessed's own history for why that shape exists).
// Several components used to hand-roll this themselves, each covering a
// different subset of these shapes (some only handled a real Date,
// silently sorting anything else to 0/epoch) - that inconsistency is
// exactly what this consolidates away.
export const toMillis = (item: unknown): number => {
  const date = dateFromTimestamp(item);
  if (date instanceof Date) {
    return date.getTime();
  }
  // parseStringDate()'s "MM/dd/yyyy" regex (below) only handles that one
  // literal format - it doesn't match the ISO strings ("2026-01-30T02:00:00")
  // most `events` documents actually store startDate as, so those still fall
  // through unparsed even after fixing the regex's literal-not-digit typo
  // (2026-08-12 fullsweep fix - it used to never match anything at all).
  // This fallback covers ISO/native-Date-parseable strings and numbers;
  // between the two, dateFromTimestamp()'s string branch now handles every
  // real date shape seen in this app's data.
  if (typeof item === 'string' || typeof item === 'number') {
    const fallback = new Date(item);
    if (!isNaN(fallback.getTime())) {
      return fallback.getTime();
    }
  }
  return 0;
};

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !isNaN(value.getTime());

const parseStringDate = (dateString: string): null | Date | string => {
  if (!dateString) {
    return null;
  }
  const match = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    // Local-time construction, same as date-fns' parse(..., 'MM/dd/yyyy')
    // used to give; reject calendar-invalid combos (02/30/2024) the way
    // parse() did, instead of letting Date roll them over.
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    const calendarValid =
      date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    return calendarValid ? date : null;
  }
  return dateString;
};
