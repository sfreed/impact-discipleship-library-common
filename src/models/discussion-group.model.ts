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
  /** Legacy free-text in-person location, written by every group created
   *  before the location wizard shipped - kept forever, never backfilled,
   *  so old rows keep rendering exactly as authored. New groups never write
   *  this; they write `location` instead. A group has at most one of
   *  `inPersonLocation`/`location` populated, never both. */
  inPersonLocation?: string;
  /** Structured in-person location, present only on groups created via the
   *  location wizard with "Offer in-person" checked. Absent entirely for
   *  online-only groups and for legacy in-person groups (which only have
   *  `inPersonLocation`). */
  location?: DiscussionGroupLocation;
  /** Set only if the group offers an online option - independent of
   *  inPersonLocation/location. */
  onlineInfo?: string;
  /** Epoch ms - a *potential* start date, not a firm commitment. */
  startDate: number;
  /** 'closed' groups are no longer shown in the open browse list, but the
   *  document (and its members subcollection) is kept, not deleted - see
   *  DiscussionGroupService.closeGroup. Staff removal (a later pass) is a
   *  real delete, distinct from a creator closing their own group. */
  status: 'open' | 'closed';
  /** 'invite-only' groups are excluded from the open browse list and from
   *  search results, but otherwise behave exactly like 'public' groups -
   *  the document, members subcollection, chat, and join-approval flow are
   *  all unaffected, same "hidden from browse, everything else intact"
   *  relationship 'closed' has today. Optional so every group created
   *  before this field existed keeps behaving as public with zero backfill
   *  - always check `=== 'invite-only'` to exclude, never `!== 'public'`,
   *  so an absent value is never mistaken for invite-only. The create
   *  wizard always writes a concrete value for new groups; this is only
   *  optional for backward compatibility with pre-existing documents. */
  groupVisibility?: 'public' | 'invite-only';
  /** Optional cap on approved members, not counting the creator - once
   *  approving a join request would bring the approved-member count (again,
   *  excluding the creator) to this number, DiscussionGroupService.
   *  approveMembership closes the group automatically. Absent means
   *  unlimited, same backward-compatible posture as groupVisibility. */
  maxMembers?: number;
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
}

/** Structured location for an in-person (or hybrid) group, collected by the
 *  create wizard's Location/Venue steps. `lat`/`lng` come from a best-effort
 *  geocode of `address1` (if shown) or city/state/country, and are stored
 *  regardless of `addressVisible` - distance search must work even for a
 *  privacy-hidden address, so only *display* code (never distance math)
 *  should ever check `addressVisible`. */
export interface DiscussionGroupLocation {
  /** ISO 3166-1 alpha-2 code (e.g. 'US', 'CA', 'GB'), not a display name. */
  country: string;
  /** USPS two-letter state code - present only when country === 'US'; the
   *  wizard skips straight to city for every other country. */
  state?: string;
  city: string;
  locationType: 'public' | 'private';
  /** Always collected by the wizard whenever in-person is offered,
   *  regardless of public/private - but only ever *rendered* to other
   *  patrons when addressVisible is true. */
  address1?: string;
  /** Always true for a public location (no prompt needed - a public venue's
   *  address is inherently fine to show). For a private location, this is
   *  the creator's explicit answer to "OK to show this address to
   *  everyone?", defaulting to false (hidden) until they opt in. A real
   *  decided boolean, never omitted when `location` is present. */
  addressVisible: boolean;
  lat?: number;
  lng?: number;
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

/** A prayer a patron chose to share into a group, entered on a lesson's
 *  prayer field (see `findPrayerFieldKeys` in the reader app) and shared at
 *  submit time. Any approved member can read; only the author or the
 *  group's creator (its de facto leader - see `DiscussionGroup.creatorEmail`,
 *  there is no separate leader concept) can delete - no client-side edit.
 *  Lives at `discussionGroups/{groupId}/prayerRequests/{requestId}`. */
export interface GroupPrayerRequest {
  id: string;
  groupId: string;
  authorEmail: string;
  authorDisplayName: string;
  text: string;
  lessonId: string;
  lessonTitle: string;
  createdAt: number;
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
