// Request/response contract of the ADMIN-facing callables (staff-only
// functions the admin app calls): campaigns, tag rules, admin users, store
// refunds, library users, language registry. ONE copy (Stage 2e-ii,
// 2026-08-20) typed on both sides - the admin app's httpsCallable() calls
// and the functions' handlers. importBookFromPdf's shapes live in
// ./book-import.types. Conventions as in ./library-callables.types:
// <name>Request = what the client sends, <name>Result = what the function
// resolves with; identity/role come from the Auth token. Several admin
// requests carry an optional `correlationId` the client attaches for
// error correlation (see the submodule's errors/correlation-id.ts) - the
// functions ignore it. Strict-clean, no SDK imports.

// ------------------------------------------------------------ campaigns

/** Server-side audience selector shared by preview + send (the admin
 *  app's CampaignAudience model is assignable to it). */
export interface CampaignAudienceSpec {
  mode?: 'everyone' | 'flags' | 'tags' | 'list';
  flags?: string[];
  tags?: string[];
  emails?: string[];
  /** Explicit override of the derived unsubscribe list; 'none' marks an
   *  OPERATIONAL send (no unsubscribe footer, newsletter opt-out ignored). */
  unsubType?: 'newsletter' | 'prayer' | 'none';
}

export interface EnqueueCampaignEmailRequest {
  emailId: string;
}
export interface EnqueueCampaignEmailResult {
  recipients: number;
  queued: number;
  sentImmediately: number;
}

export interface PreviewCampaignAudienceRequest {
  audience: CampaignAudienceSpec;
}
export interface PreviewCampaignAudienceResult {
  count: number;
  /** Up to 10 recipient emails. */
  sample: string[];
}

export interface SendCampaignTestEmailRequest {
  emailId: string;
  to: string;
}
export interface SendCampaignTestEmailResult {
  mailDocId: string;
}

export interface DeleteCampaignRequest {
  campaignId: string;
  /** true = plan only (nothing deleted), false = execute the cascade. */
  dryRun: boolean;
}
/** dryRun: true */
export interface CampaignDeletePlan {
  name: string;
  emailCount: number;
  publishedCount: number;
  hasPopup: boolean;
  /** Touches currently sending/scheduled - the delete is refused while any. */
  inFlight: string[];
  imageCandidates: number;
}
/** dryRun: false */
export interface CampaignDeleteResult {
  emailsDeleted: number;
  popupDeleted: boolean;
  imagesDeleted: string[];
  imagesKept: string[];
  imagesFailed: string[];
}
export type DeleteCampaignResult = CampaignDeletePlan | CampaignDeleteResult;

// ------------------------------------------------------------ tag rules

export interface ApplyTagRuleRetroactivelyRequest {
  ruleId: string;
}
export interface ApplyTagRuleRetroactivelyResult {
  scanned: number;
  matched: number;
  customersTagged: number;
  applicationsCreated: number;
  skippedNoCustomer: number;
}

// ---------------------------------------------------------- admin users

export interface CreateAdminUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  /** A Role enum value ('Admin' | 'Employee' | 'Editor' | ...). */
  role: string;
  phone?: unknown;
  shippingAddress?: unknown;
  billingAddress?: unknown;
}
export interface CreateAdminUserResult {
  uid: string;
  docId: string;
}

export interface DeleteAdminUserRequest {
  docId: string;
}
export interface DeleteAdminUserResult {
  docId: string;
}

// --------------------------------------------------------- store refunds

export interface RefundStorePurchaseRequest {
  purchaseId: string;
  revokeLicenses: boolean;
  /** Partial refund amount; omitted/null = full refund of the remainder. */
  amount?: number | null;
}
export interface RefundStorePurchaseResult {
  refunded: boolean;
  fullyRefunded: boolean;
  refundAmount: number;
  fulfillmentClosed: boolean;
  paypalRefunded: boolean;
  refundId: string | null;
  revokedBookIds: string[];
}

export interface RevokeStorePurchasedLicenseRequest {
  email: string;
  bookId: string;
  storePurchaseId?: string;
  correlationId?: string;
}
export interface RevokeStorePurchasedLicenseResult {
  removed: boolean;
}

// --------------------------------------------------------- library users

/** Editable profile fields (the function rejects unknown keys). */
export type UpdateLibraryUserRequest = {
  email: string;
  correlationId?: string;
} & Record<string, unknown>;
export interface UpdateLibraryUserResult {
  email: string;
}

export interface SetLibraryUserRevokedRequest {
  email: string;
  revoked: boolean;
  correlationId?: string;
}
export interface SetLibraryUserRevokedResult {
  email: string;
  revoked: boolean;
  authAccountFound: boolean;
}

export interface GrantLibraryUserLicensesRequest {
  email: string;
  bookIds: string[];
  correlationId?: string;
}
export interface GrantLibraryUserLicensesResult {
  granted: string[];
  skipped: string[];
}

export interface RevokeAdminGrantedLicenseRequest {
  email: string;
  bookId: string;
  correlationId?: string;
}
export interface RevokeAdminGrantedLicenseResult {
  removed: boolean;
}

export interface SendLibraryUserMessageRequest {
  recipients: string[] | 'all';
  title: string;
  body: string;
  correlationId?: string;
}
export interface SendLibraryUserMessageResult {
  messageId: string;
  recipientCount: number;
  pushSuccessCount: number;
}

// ---------------------------------------------------- language registry

export type RebuildLanguageRegistryRequest = Record<string, never>;
export interface RebuildLanguageRegistryResult {
  locales: Record<string, string>;
  count: number;
}
