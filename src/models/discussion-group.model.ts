// Shared "Discussion Groups" shapes - patrons advertise a group around a
// book (in-person location and/or online, plus a potential start date),
// other patrons request to join, and the creator approves/rejects requests.
// Identical in both impact-discipleship-library-new (where all of this is
// built first - creation, browsing, join requests) and
// impact-discipleship-library-manager-new (staff view/create/remove,
// added later) - both apps read/write the same `discussionGroups`
// collection, so these must stay in sync.

export interface DiscussionGroup {
  id: string;
  bookId: string;
  title: string;
  description?: string;
  /** Keyed by email (not uid) to match every other patron-authored
   *  collection in this project (LibraryUser, Purchase, etc.) - see
   *  LibraryUser's doc comment for why. */
  creatorEmail: string;
  creatorDisplayName: string;
  /** Set only if the group offers an in-person option - independent of
   *  onlineInfo, since a group can offer either or both ("hybrid"). */
  inPersonLocation?: string;
  /** Set only if the group offers an online option - independent of
   *  inPersonLocation. */
  onlineInfo?: string;
  /** Epoch ms - a *potential* start date, not a firm commitment. */
  startDate: number;
  /** 'closed' groups are no longer shown in the open browse list, but the
   *  document (and its members subcollection) is kept, not deleted - see
   *  DiscussionGroupService.closeGroup. Staff removal (a later pass) is a
   *  real delete, distinct from a creator closing their own group. */
  status: 'open' | 'closed';
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
}

export type GroupMembershipStatus = 'pending' | 'approved' | 'rejected';

/** One patron's relationship to a group - lives in the
 *  `discussionGroups/{groupId}/members/{email}` subcollection, doc id =
 *  the member's (lowercased) email, matching the parent's own email-keyed
 *  convention. The creator gets an 'approved' doc here too, written at
 *  group-creation time, so "am I a member of this group" never needs a
 *  special case for "or am I the creator". */
export interface GroupMembership {
  /** Denormalized parent id - a `collectionGroup('members')` query (see
   *  getMyMemberships) has no other way to know which group a result
   *  belongs to, since the mapped plain object doesn't carry its own
   *  Firestore path. */
  groupId: string;
  email: string;
  displayName: string;
  status: GroupMembershipStatus;
  requestedAt: number;
  respondedAt?: number;
}

/** One message in a group's shared chat - any approved member (including
 *  the creator) can post; every approved member can read. Lives at
 *  `discussionGroups/{groupId}/chatMessages/{messageId}`. */
export interface GroupChatMessage {
  id: string;
  groupId: string;
  senderEmail: string;
  senderDisplayName: string;
  text: string;
  sentAt: number;
}

/** A 1:1 thread between a group's creator and exactly one other person -
 *  either an approved member or a rejected/pending requester (messaging a
 *  requester who was turned down is exactly this same mechanism). Lives at
 *  `discussionGroups/{groupId}/conversations/{otherEmail}`, doc id ==
 *  `otherEmail` - fixing both participants' identities directly in the path
 *  keeps firestore.rules simple (no participant list to search). Always
 *  leader-initiated: the creator starts it via a "Message" action; once it
 *  exists, `otherEmail` can see and reply to it. */
export interface GroupConversation {
  id: string;
  groupId: string;
  creatorEmail: string;
  otherEmail: string;
  otherDisplayName: string;
}

/** One message in a GroupConversation - lives at
 *  `discussionGroups/{groupId}/conversations/{otherEmail}/messages/{messageId}`. */
export interface ConversationMessage {
  id: string;
  senderEmail: string;
  senderDisplayName: string;
  text: string;
  sentAt: number;
}
