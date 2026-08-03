// A book license a group leader pre-purchased (at a bulk discount, see
// bulk-discount-tier.model.ts) so it can be handed out to their Impact
// Group's members. Lives in the top-level `groupLicenses` collection.
// Deliberately owned by the *leader*, scoped only by `bookId` - not hard-tied
// to whichever group was active when it was purchased. An unassigned unit is
// a personal reserve the leader can draw from for any of their groups
// studying that book, including ones created later; only an *assignment*
// (recipient + group) can lock permanently, once that group closes or
// changes book - see DiscussionGroupService/functions/src/index.ts's
// `revokeGroupLicense` for where that check lives. Every mutation goes
// through a Cloud Function (assignGroupLicense/revokeGroupLicense/
// purchaseGroupLicenses) - firestore.rules blocks all client writes.

export type GroupLicenseStatus = 'unassigned' | 'assigned';

export interface GroupLicense {
  id: string;
  leaderEmail: string;
  bookId: string;
  /** The `purchases` doc this unit was created from - provenance only,
   *  several licenses can share the same purchaseId (one purchase buys N). */
  purchaseId: string;
  status: GroupLicenseStatus;
  /** Which of the leader's groups this unit is currently handed out through
   *  - present only while `status === 'assigned'`. Cleared on revoke, so an
   *  unassigned unit is never tied to a specific group in storage. */
  assignedGroupId?: string;
  assignedToEmail?: string;
  assignedAt?: number;
  createdAt: number;
}
