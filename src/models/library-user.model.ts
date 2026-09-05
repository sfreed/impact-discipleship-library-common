// A library patron's `libraryUsers` profile - THE type for that document,
// shared by the reader app (which reads and, through its own preferences,
// writes it) and the admin app's Library section (which reads it and edits
// it through this repo's Cloud Functions). Until 2026-09-05 each app kept a
// hand-synced copy of this interface and the two had drifted: the admin's
// did not know about the reader's theme, canLeadGroups or legacyId fields,
// the reader's did not know about the admin-only `type` on a licence entry,
// and the two disagreed about which fields were required.
//
// Keyed by email (the doc id equals `email`), not a Firebase Auth uid -
// matches how LessonSubmission is keyed, and avoids needing Admin SDK access
// to resolve a uid during import (see the reader's scripts/backfill-users.js).
//
// The AUTHORITATIVE writers are the admin repo's Cloud Functions
// (library-users.functions.ts, library-store-license-grant.ts,
// library-group-license-grant/revoke.ts) plus the reader's own
// LibraryUserService for the patron's personal preferences. Every admin
// WRITE goes through those functions, never a direct client write
// (firestore.rules scopes `libraryUsers` writes to the owner's own email).

/** Approximate location derived from the patron's IP address at login (see
 *  the reader's GeoLocationService) - city-level accuracy, never asked for
 *  device permission. Overwritten on every successful lookup, so this is
 *  always the *most recent* known location, not a history. Read by the
 *  admin's world map feature. */
export interface LibraryUserLocation {
  lat: number;
  lng: number;
  city?: string;
  region?: string;
  country?: string;
  /** ISO 3166-1 alpha-2 code (e.g. 'US') - what the international-patron
   *  detection compares against, rather than the display-oriented `country`
   *  name string. Absent on locations recorded before this field existed. */
  countryCode?: string;
  updatedAt: number;
}

/** One entry in a patron's `bookLicenses` provenance array. See
 *  LibraryUser.licensedBookIds for the flat id list actually used to enforce
 *  access - this richer shape is kept for display/provenance only.
 *
 *  A license never expires. `length` (always 1, written by the legacy
 *  impactdisciples-web store) used to imply a term, but nothing ever
 *  enforced one: access is gated on plain membership in
 *  LibraryUser.licensedBookIds, a flat id array with no dates. A license
 *  ends only by explicit revocation - refund (refundStorePurchase),
 *  group-license return, or an admin revoke - never by elapsed time.
 *  purchaseDate stays for provenance/display only. */
export interface LibraryUserBookLicense {
  bookId: string;
  language?: string;
  purchaseDate?: number;
  /** Provenance of this entry, stamped by the admin repo's Cloud Functions
   *  (the only writers): 'group-license' from a group leader's
   *  `assignGroupLicense` (lets `revokeGroupLicense` remove exactly this
   *  entry via `groupLicenseId` without disturbing a separate license for the
   *  same book); 'store-purchase' from applyStorePurchaseGrant (web storefront
   *  and reader Store checkouts alike, `storePurchaseId` = the purchases doc
   *  id); 'admin-grant' from grantLibraryUserLicenses (`grantedBy` = the staff
   *  uid). Absent only on legacy pre-consolidation entries.
   *
   *  admin-grant and store-purchase entries are removable from the admin's
   *  Library Users screen (store removals via revokeStorePurchasedLicense -
   *  no refund attached); group licenses are managed from their group; the
   *  refund path strips store-purchase entries itself when asked to. */
  source?: 'group-license' | 'admin-grant' | 'store-purchase';
  groupLicenseId?: string;
  storePurchaseId?: string;
  grantedBy?: string;
  /** Legacy "year" marker from the old web store - meaningless (see above),
   *  present on some imported entries, never written today. */
  type?: string;
}

export interface LibraryUser {
  /** Doc id == lowercased email (not a Firebase Auth uid). */
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  /** Absent on a record created fresh by the reader's
   *  LibraryUserService.updateOwnPreferences (a brand-new patron with no
   *  legacy impact-users import) rather than by the backfill script - treat
   *  as empty when absent. */
  bookLicenses?: LibraryUserBookLicense[];
  /** Flat list of licensed book ids, derived from bookLicenses - the actual
   *  field firestore.rules checks (`bookId in licensedBookIds`) to gate
   *  reading a book/unit/lesson. A plain string array rather than reaching
   *  into bookLicenses' array-of-objects shape, since Firestore security
   *  rules can't query into fields of objects inside an array - only
   *  membership-test a flat array of primitives. Always present (empty
   *  array, never absent) on any doc the rules need to evaluate against, so
   *  a missing field is never mistaken for "not yet loaded". The old 'all'
   *  staff-bypass sentinel no longer exists in dev or prod data (verified
   *  2026-08-20; staff access comes from the role claim). */
  licensedBookIds: string[];
  createdAt: number;
  updatedAt: number;
  /** Firebase Auth uid, set the first time this email signs into the reader
   *  - see LibraryUserService.recordLogin. Blank/absent for a record that's
   *  only ever existed as an import, never actually signed in. */
  userId?: string;
  /** Stamped by the reader's LibraryUserService.recordLogin on every app
   *  session entry - not logged as a discrete event, just a "last active"
   *  signal. */
  lastLogin?: number;
  /** Self-service appearance/locale preferences, set from the reader's
   *  Settings screen - see its ThemeService and
   *  LibraryUserService.updateOwnPreferences. Read-only in the admin. */
  darkMode?: boolean;
  /** Color theme id chosen while in light mode - absent means the default
   *  (azure/violet) theme. Independent from darkColorTheme since light/dark
   *  mode each offer a different catalog of options, so switching darkMode
   *  doesn't lose the other mode's choice. */
  lightColorTheme?: string;
  /** Color theme id chosen while in dark mode - absent means the default. */
  darkColorTheme?: string;
  /** ISO 639-1 language code - which language the reader renders a lesson
   *  in when that lesson has a translation for it, falling back to the
   *  lesson's original language otherwise. */
  preferredLanguage?: string;
  /** Master push-notification opt-in, set from the reader's Settings
   *  screen. ABSENT means ENABLED - the admin repo's sender triggers only
   *  skip a recipient when this is literally false, so existing patrons get
   *  notifications without a migration. Sender-side switch: the device's
   *  FCM token stays registered (see fcmTokens subcollection) either way. */
  notificationsEnabled?: boolean;
  /** The arbitrary Firestore id this record had in the legacy impact-users
   *  collection - kept for provenance/traceability only; nothing looks a
   *  user up by it. */
  legacyId?: string;
  legacyImport?: boolean;
  /** Absent until the first successful IP geolocation lookup - see the
   *  reader's GeoLocationService and LibraryUserService.recordLogin. */
  location?: LibraryUserLocation;
  /** True once this patron has EVER connected from outside the United
   *  States (per an IP geolocation lookup at session entry). Deliberately
   *  sticky: a later US login never unsets it, and a failed/skipped lookup
   *  leaves it untouched; only staff editing the doc directly can clear it.
   *  While true, the patron reads every book free of charge
   *  (firestore.rules' isInternationalPatron() bypasses hasBookLicense the
   *  same way isLibraryStaff() does) and the Store / group-license
   *  purchasing UI is hidden entirely - overseas patrons are never asked to
   *  pay. See the reader's BookAccessService for the client-side mirror. */
  internationalUser?: boolean;
  /**
   * Whether this patron may START an Impact Group.
   *
   * The intent is that only someone who has worked through all four Impact
   * books leads a group. Until that seed data exists, every account carries
   * true; when it arrives, most will be set to false.
   *
   * ABSENT MEANS ALLOWED. A doc that predates the backfill, or one written by
   * something that does not know about this field, must not silently lock a
   * patron out of something they could do yesterday - so only an explicit
   * `false` withholds it. Read `canLeadGroups !== false`, never
   * `canLeadGroups === true`.
   *
   * Gates CREATION only. Someone whose flag is off keeps running any group
   * they already lead - approving members, inviting, assigning licences - or
   * a live group would be stranded mid-study with nobody able to run it. What
   * disappears is Start, Clone and Promote, and the Leader's Guide inside the
   * app. The PUBLIC /guide/leader stays readable to everyone, signed in or
   * not: the website, invitation emails and the Play listing all link to it,
   * and it is what someone reads while deciding whether to lead at all.
   *
   * Enforced server-side by the createGroup Cloud Function; hiding the
   * buttons alone would be theatre.
   */
  canLeadGroups?: boolean;
  /** Staff-set access revocation (admin app -> setLibraryUserRevoked Cloud
   *  Function): the Firebase Auth account is disabled alongside and refresh
   *  tokens are revoked, so a revoked patron can't stay signed in; reversible
   *  (un-revoke deletes revokedAt/revokedBy). Read-only in the reader. */
  revoked?: boolean;
  revokedAt?: number;
  revokedBy?: string;
}
