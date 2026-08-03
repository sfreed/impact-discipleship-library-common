// A leader's email invitation to a specific person for an invite-only
// discussion group - lives in the top-level `groupInvites` collection (not
// a subcollection of discussionGroups, so an unauthenticated invitee can be
// pointed at one specific doc via a Cloud Function without needing to know
// or read the parent group). The doc's own auto-generated id is the bearer
// token embedded in the invite link/email - no separate token field.

export type GroupInviteStatus = 'pending' | 'accepted' | 'declined';

export interface GroupInvite {
  id: string;
  groupId: string;
  bookId: string;
  /** Denormalized at send time purely for the leader's own sent-invites
   *  list - never trusted for the invitee-facing preview page, which always
   *  reads the live group/book state instead (see getInviteDetails). */
  groupTitle: string;
  leaderEmail: string;
  leaderDisplayName: string;
  /** Always lowercased at write time - this is what ties an accepted invite
   *  to exactly one signed-in identity in acceptGroupInvite. */
  inviteeEmail: string;
  /** Whether the leader intends to attach a license - intent only. No unit
   *  is reserved when the invite is sent; acceptGroupInvite attempts to
   *  grant one from the leader's unassigned pool at accept time and simply
   *  leaves this ungranted if none is available then. */
  licenseIntent: boolean;
  status: GroupInviteStatus;
  createdAt: number;
  respondedAt?: number;
  /** Set only once accepted AND a unit was actually available at that
   *  moment - absent means either no license was intended, or one was
   *  intended but none was left. */
  grantedLicenseId?: string;
}
