// Shared shapes for admin-sent announcements to library users. The manager
// app's sendLibraryUserMessage Cloud Function (Admin SDK, the only writer)
// fans one LibraryUserMessage doc out to each recipient's own
// libraryUsers/{email}/messages/{messageId} subcollection (its doc id ==
// adminMessageId, so a retried send overwrites rather than duplicates) and
// writes one AdminMessage summary doc to adminMessages/{messageId}. The
// reader app's inbox screen reads the per-recipient docs (owner-only; the
// owner may flip `read` to true and delete already-read messages); the
// manager app's sent-messages history screen reads the summaries
// (admin-only). See firestore.rules for both gates.

/** One recipient's copy of an announcement, in their own inbox subcollection. */
export interface LibraryUserMessage {
  id: string;
  title: string;
  body: string;
  /** epoch ms, Date.now() - same convention as ActivityLogEntry. */
  sentAt: number;
  /** Sending admin's Firebase Auth uid (adminUsers doc id). */
  sentBy: string;
  /** Sending admin's display name, snapshotted at send time. */
  sentByName: string;
  /** Flipped to true by the recipient's own client when they open the
   *  message - the only owner-writable field, and the precondition for the
   *  owner deleting the doc (see firestore.rules). */
  read: boolean;
  /** The adminMessages summary doc this copy was fanned out from (== id). */
  adminMessageId: string;
}

/** One summary doc per admin broadcast - manager-side history/audit. */
export interface AdminMessage {
  id: string;
  title: string;
  body: string;
  sentAt: number;
  sentBy: string;
  sentByName: string;
  /** 'all' expands to every non-revoked library user at send time;
   *  'selected' is an explicit email list. */
  recipientScope: 'all' | 'selected';
  /** Lowercased recipient emails - present only for 'selected' sends ('all'
   *  would just be a point-in-time roster snapshot of unbounded size). */
  recipients?: string[];
  recipientCount: number;
  /** How many recipients had at least one device push delivery succeed -
   *  informational; the inbox doc is the message of record either way. */
  pushSuccessCount: number;
}
