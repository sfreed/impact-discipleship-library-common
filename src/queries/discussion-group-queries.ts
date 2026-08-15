// Plain-function Firestore reads shared between impact-discipleship-library-new
// (where groups are created/browsed/joined) and impact-discipleship-library-manager-new
// (admin Impact Groups module - list/search/edit/delete any group) - see
// library-queries.ts for why these are plain functions rather than an
// injectable service. Writes (createGroup, closeGroup, requestToJoin, staff
// edit/delete, etc.) are deliberately NOT here - they differ enough between
// a patron's own actions and staff moderation that each app's own
// DiscussionGroupService owns them directly instead.

import {
  Firestore,
  collection,
  collectionGroup,
  doc,
  docData,
  collectionData,
  limit,
  orderBy,
  query,
  where,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import {
  ConversationMessage,
  DiscussionGroup,
  GroupChatMessage,
  GroupConversation,
  GroupMembership,
  GroupPrayerRequest,
} from '../models/discussion-group.model';

/** Cap on how much message/prayer-request history a live listener pulls per
 *  thread (group chat, a 1:1 conversation, or a group's prayer requests) - a
 *  hard cap on RECENCY, not true "load more" pagination (neither app has a
 *  "load older" UI for these yet). Bounds read/render/memory cost for an
 *  unusually long-lived thread instead of the previous fully-unbounded
 *  read; the tradeoff is that history older than this many entries isn't
 *  reachable from these screens - nothing is deleted, it's just not
 *  fetched by default. Generous relative to this feature's actual scale
 *  (small patron-organized groups, not high-volume chat) so it should
 *  rarely bind in practice; revisit with real pagination if that changes. */
const RECENT_ENTRY_LIMIT = 200;

export function getOpenGroups(firestore: Firestore): Observable<DiscussionGroup[]> {
  const ref = collection(firestore, 'discussionGroups');
  return collectionData(query(ref, where('status', '==', 'open'), orderBy('startDate')), {
    idField: 'id',
  }) as Observable<DiscussionGroup[]>;
}

/** Every group regardless of status/visibility, newest first - the manager
 *  app's admin table source list (unlike getOpenGroups, which is
 *  patron-Browse-tab-scoped to open+non-excluded groups only). No `where`
 *  filter needed - `firestore.rules`' discussionGroups read is unconditional
 *  for any signed-in user, so this doesn't hit the "unconstrained list
 *  query" restriction license-gated collections do. */
export function getAllGroups(firestore: Firestore): Observable<DiscussionGroup[]> {
  const ref = collection(firestore, 'discussionGroups');
  return collectionData(query(ref, orderBy('createdAt', 'desc')), { idField: 'id' }) as Observable<DiscussionGroup[]>;
}

/** Every group-membership doc across every group, unfiltered - lets the
 *  manager app's admin table compute a per-group member count client-side
 *  (group small enough in practice that this "fetch everything, group by
 *  groupId" approach matches the rest of this feature's scale assumptions)
 *  without a per-row subcollection query for every row in the table. Same
 *  rule basis as getMyMemberships: `members/{email}`'s read rule is
 *  unconditional for any signed-in user, so an unfiltered collectionGroup
 *  query is just as permitted as email-filtered one. */
export function getAllGroupMemberships(firestore: Firestore): Observable<GroupMembership[]> {
  const ref = collectionGroup(firestore, 'members');
  return collectionData(ref) as Observable<GroupMembership[]>;
}

export function getGroup(firestore: Firestore, groupId: string): Observable<DiscussionGroup | undefined> {
  const ref = doc(firestore, 'discussionGroups', groupId);
  return docData(ref, { idField: 'id' }) as Observable<DiscussionGroup | undefined>;
}

export function getGroupMembers(firestore: Firestore, groupId: string): Observable<GroupMembership[]> {
  const ref = collection(firestore, 'discussionGroups', groupId, 'members');
  return collectionData(ref) as Observable<GroupMembership[]>;
}

/** Every group-membership doc (any status - pending, approved, rejected)
 *  belonging to one patron, across every group - a `collectionGroup` query
 *  rather than needing to already know which groups to check, same pattern
 *  as the reader app's own lessonHighlights collection-group read. Callers
 *  join this back to each group's own document (getGroup) to render
 *  anything beyond the membership status itself. */
export function getMyMemberships(firestore: Firestore, email: string): Observable<GroupMembership[]> {
  const ref = collectionGroup(firestore, 'members');
  return collectionData(query(ref, where('email', '==', email.trim().toLowerCase()))) as Observable<
    GroupMembership[]
  >;
}

/** Every group this patron created, newest first - the Manage tab's source
 *  list. Needs a composite index (creatorEmail + createdAt) - see
 *  firestore.indexes.json. */
export function getMyCreatedGroups(firestore: Firestore, email: string): Observable<DiscussionGroup[]> {
  const ref = collection(firestore, 'discussionGroups');
  return collectionData(
    query(ref, where('creatorEmail', '==', email.trim().toLowerCase()), orderBy('createdAt', 'desc')),
    { idField: 'id' },
  ) as Observable<DiscussionGroup[]>;
}

export function getGroupChatMessages(firestore: Firestore, groupId: string): Observable<GroupChatMessage[]> {
  const ref = collection(firestore, 'discussionGroups', groupId, 'chatMessages');
  // Query the RECENT_ENTRY_LIMIT most recent messages (descending), then
  // reverse back to the chronological (ascending) order the chat UI renders
  // in - orderBy('sentAt') ascending with a limit() would instead return the
  // OLDEST messages, the opposite of what "recent" means here.
  return (
    collectionData(query(ref, orderBy('sentAt', 'desc'), limit(RECENT_ENTRY_LIMIT)), {
      idField: 'id',
    }) as Observable<GroupChatMessage[]>
  ).pipe(map((messages) => [...messages].reverse()));
}

/** Every prayer shared into this group, newest first (browsed as a list,
 *  unlike chat's chronological read). See GroupPrayerRequest. */
export function getGroupPrayerRequests(firestore: Firestore, groupId: string): Observable<GroupPrayerRequest[]> {
  const ref = collection(firestore, 'discussionGroups', groupId, 'prayerRequests');
  return collectionData(query(ref, orderBy('createdAt', 'desc'), limit(RECENT_ENTRY_LIMIT)), {
    idField: 'id',
  }) as Observable<GroupPrayerRequest[]>;
}

export function getConversation(
  firestore: Firestore,
  groupId: string,
  otherEmail: string,
): Observable<GroupConversation | undefined> {
  const ref = doc(firestore, 'discussionGroups', groupId, 'conversations', otherEmail.trim().toLowerCase());
  return docData(ref, { idField: 'id' }) as Observable<GroupConversation | undefined>;
}

export function getConversationMessages(
  firestore: Firestore,
  groupId: string,
  otherEmail: string,
): Observable<ConversationMessage[]> {
  const ref = collection(
    firestore,
    'discussionGroups',
    groupId,
    'conversations',
    otherEmail.trim().toLowerCase(),
    'messages',
  );
  // See getGroupChatMessages' identical comment - same recent-window +
  // reverse-to-chronological approach.
  return (
    collectionData(query(ref, orderBy('sentAt', 'desc'), limit(RECENT_ENTRY_LIMIT)), {
      idField: 'id',
    }) as Observable<ConversationMessage[]>
  ).pipe(map((messages) => [...messages].reverse()));
}

/** Every open conversation thread for a group, for the creator's Manage tab
 *  (a normal subcollection read, not a collectionGroup query - already
 *  scoped to one group). */
export function getGroupConversations(firestore: Firestore, groupId: string): Observable<GroupConversation[]> {
  const ref = collection(firestore, 'discussionGroups', groupId, 'conversations');
  return collectionData(ref, { idField: 'id' }) as Observable<GroupConversation[]>;
}
