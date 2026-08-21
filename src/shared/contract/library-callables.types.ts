// Request/response contract of the reader-facing callables (Impact Groups,
// group licenses + invites, reader Store purchase, reader profile/account),
// i.e. CALLABLE_FUNCTIONS.{createGroup, ..., updateMyPreferences}. ONE copy
// (Stage 2e-ii, 2026-08-20): the reader app types its httpsCallable()
// calls with these, and the admin repo's functions type their handlers'
// request casts (as Partial<XRequest> - every field is validated
// server-side) and return values (XResult) with them - so a field rename on
// either side is a compile error on the other.
//
// Conventions: <name>Request is exactly what the client SENDS (identity
// always comes from the Auth token, never the payload); <name>Result is
// exactly what the function RESOLVES with. Strict-clean, no SDK imports;
// functions/ compiles this under TypeScript 4.9.

import type { DiscussionGroupLocation } from '../../models/discussion-group.model';

// ---------------------------------------------------------------- groups

export interface CreateGroupRequest {
  bookId: string;
  title: string;
  description?: string;
  inPersonLocation?: string;
  location?: DiscussionGroupLocation;
  onlineInfo?: string;
  /** Epoch millis. */
  startDate: number;
  /** IANA zone the startDate was picked in. */
  startTimeZone: string;
  groupVisibility: 'public' | 'invite-only';
  maxMembers?: number;
  creatorDisplayName: string;
}
export interface CreateGroupResult {
  groupId: string;
}

export interface RequestToJoinGroupRequest {
  groupId: string;
  displayName?: string;
}
export interface RequestToJoinGroupResult {
  requested: boolean;
  alreadyMember?: boolean;
}

export interface ApproveGroupMembershipRequest {
  groupId: string;
  memberEmail: string;
}
export interface ApproveGroupMembershipResult {
  approved: boolean;
}

export interface RejectGroupMembershipRequest {
  groupId: string;
  memberEmail: string;
}
export interface RejectGroupMembershipResult {
  rejected: boolean;
}

export interface CloseMyGroupRequest {
  groupId: string;
}
export interface CloseMyGroupResult {
  closed: boolean;
}

export interface SendGroupInviteRequest {
  groupId: string;
  inviteeEmail: string;
  /** Whether the leader intends to cover the invitee's book license. */
  licenseIntent: boolean;
  bookTitle?: string;
}
export interface SendGroupInviteResult {
  inviteId: string;
}

export interface CancelGroupInviteRequest {
  inviteId: string;
}
export interface CancelGroupInviteResult {
  cancelled: boolean;
}

// --------------------------------------------- group licenses + invites

export interface PurchaseGroupLicensesRequest {
  groupId: string;
  quantity: number;
  /** Absent for a $0 (international / fully discounted) purchase. */
  payPalOrderId?: string;
}
export interface PurchaseGroupLicensesResult {
  purchaseId: string;
  licenseIds: string[];
  /** Set when one of the new licenses was auto-assigned to the buyer. */
  selfAssignedLicenseId?: string;
}

export interface AssignGroupLicenseRequest {
  licenseId: string;
  groupId: string;
  recipientEmail: string;
}
export interface AssignGroupLicenseResult {
  success: boolean;
}

export interface RevokeGroupLicenseRequest {
  licenseId: string;
}
export interface RevokeGroupLicenseResult {
  success: boolean;
}

export interface LeaveGroupAndRevokeLicenseRequest {
  groupId: string;
}
export interface LeaveGroupAndRevokeLicenseResult {
  success: boolean;
}

export interface CopyGroupMembersRequest {
  sourceGroupId: string;
  targetGroupId: string;
  /** Subset of the source roster to copy; omitted = everyone approved. */
  memberEmails?: string[];
}
export interface CopyGroupMembersResult {
  copiedCount: number;
}

export interface GetInviteDetailsRequest {
  inviteId: string;
}
export interface GetInviteDetailsResult {
  status: 'pending' | 'accepted' | 'declined';
  inviteeEmail: string;
  leaderDisplayName: string;
  groupTitle: string;
  bookTitle: string;
  startDate?: number;
  startTimeZone?: string;
  onlineInfo?: string;
  locationSummary?: string;
  licenseIntent: boolean;
}

export interface DeclineGroupInviteRequest {
  inviteId: string;
  reason?: string;
}
export interface DeclineGroupInviteResult {
  justDeclined: boolean;
  leaderEmail: string;
  leaderDisplayName: string;
  groupTitle: string;
  inviteeEmail: string;
  declineReason?: string;
}

export interface AcceptGroupInviteRequest {
  inviteId: string;
}
export interface AcceptGroupInviteResult {
  groupId: string;
  groupTitle: string;
  licenseGranted: boolean;
}

// ------------------------------------------------------- reader store

export interface VerifyAndGrantReaderStorePurchaseRequest {
  /** Only `id` is read server-side (prices are recomputed from `products`);
   *  clients may send their fuller cart-item shape. */
  cartItems: Array<{ id: string }>;
  couponCode?: string;
  /** Absent for a $0 purchase. */
  payPalOrderId?: string;
  /** Client-side display totals - informational only, never trusted. */
  subtotal?: number;
  discount?: number;
  total?: number;
}
export interface VerifyAndGrantReaderStorePurchaseResult {
  purchaseId: string;
  granted: boolean;
  pending?: boolean;
  grantedBookIds?: string[];
  skippedBookIds?: string[];
  /** True when the same PayPal order had already been processed. */
  alreadyProcessed?: boolean;
}

export interface LookupCouponRequest {
  code: string;
}
/** The public subset of a coupon the lookupCoupon callable (and the web
 *  site's lookup_coupon HTTP function) return. */
export interface CouponPublicFields {
  id: string;
  code: string;
  isActive: boolean;
  percentOff: number | null;
  tags?: Array<{ id: string }>;
}
export interface LookupCouponResult {
  coupon: CouponPublicFields | null;
}

// ---------------------------------------------- reader profile/account

/** Approximate location derived from the patron's IP at login - the shape
 *  the reader's LibraryUserLocation model stores. */
export interface ReaderLocationInput {
  lat: number;
  lng: number;
  city?: string;
  region?: string;
  country?: string;
  /** ISO 3166-1 alpha-2. */
  countryCode?: string;
  updatedAt: number;
}

export interface RecordMyLoginRequest {
  location?: ReaderLocationInput;
}
export interface RecordMyLoginResult {
  recorded: boolean;
}

export interface CreateMyReaderProfileRequest {
  firstName: string;
  lastName: string;
  location?: ReaderLocationInput;
}
export interface CreateMyReaderProfileResult {
  created: boolean;
}

/** Strict allow-list - the function rejects any other key. */
export interface UpdateMyPreferencesRequest {
  darkMode?: boolean;
  preferredLanguage?: string;
  lightColorTheme?: string;
  darkColorTheme?: string;
  notificationsEnabled?: boolean;
}
export interface UpdateMyPreferencesResult {
  updated: boolean;
}

export type DeleteMyAccountRequest = Record<string, never>;
export interface DeleteMyAccountResult {
  deleted: boolean;
}
