// The Cloud Functions contract: every function the suite deploys, by name
// and kind. ONE list, consumed by
//   - the web app (HTTP function URLs in its environment files),
//   - the reader and admin apps (httpsCallable names),
//   - functions/ itself (copied in by functions/scripts/sync-shared.js;
//     functions/test/contract.test.js asserts index.ts exports exactly this
//     set, so a new/renamed/removed function fails the build until the
//     contract - and therefore every client - is updated).
// Names are the deployed Firebase function names. Keys equal values on
// purpose: a typo in a consumer is a compile error, and grep-ability is
// preserved. Request/response TYPES are the next step (Stage 2e-ii) - for
// now they stay on each side.
//
// Strict-clean, no imports: the reader compiles this under full `strict`
// and functions/ compiles it under TypeScript 4.9.

/** HTTP (onRequest) functions - called by URL, see
 *  config/firebase-projects.ts functionUrl(). Anonymous callers where the
 *  public web site needs them; restrictedCors gates browser origins. */
export const HTTP_FUNCTIONS = {
  get_shipping_rates: 'get_shipping_rates',
  get_shipping_label: 'get_shipping_label',
  create_paypal_order: 'create_paypal_order',
  capture_paypal_order: 'capture_paypal_order',
  subscribe_to_email_list: 'subscribe_to_email_list',
  unsubscribe_from_email_list: 'unsubscribe_from_email_list',
  get_youtube_videos: 'get_youtube_videos',
  get_youtube_videos_public: 'get_youtube_videos_public',
  get_youtube_podcasts_public: 'get_youtube_podcasts_public',
  campaign_open: 'campaign_open',
  campaign_click: 'campaign_click',
  campaign_web_event: 'campaign_web_event',
  newsletter_archive: 'newsletter_archive',
  search_impact_groups: 'search_impact_groups',
  lookup_coupon: 'lookup_coupon',
  register_for_event: 'register_for_event',
  get_event_registration: 'get_event_registration',
  update_my_sessions: 'update_my_sessions',
  check_registration_exists: 'check_registration_exists',
  get_session_counts: 'get_session_counts',
} as const;

/** Callable (onCall) functions - httpsCallable(functions, NAME). Identity
 *  comes from the caller's Firebase Auth token. */
export const CALLABLE_FUNCTIONS = {
  // admin app
  createAdminUser: 'createAdminUser',
  deleteAdminUser: 'deleteAdminUser',
  applyTagRuleRetroactively: 'applyTagRuleRetroactively',
  enqueueCampaignEmail: 'enqueueCampaignEmail',
  previewCampaignAudience: 'previewCampaignAudience',
  sendCampaignTestEmail: 'sendCampaignTestEmail',
  deleteCampaign: 'deleteCampaign',
  rebuildLanguageRegistry: 'rebuildLanguageRegistry',
  importBookFromPdf: 'importBookFromPdf',
  refundStorePurchase: 'refundStorePurchase',
  revokeStorePurchasedLicense: 'revokeStorePurchasedLicense',
  updateLibraryUser: 'updateLibraryUser',
  setLibraryUserRevoked: 'setLibraryUserRevoked',
  grantLibraryUserLicenses: 'grantLibraryUserLicenses',
  revokeAdminGrantedLicense: 'revokeAdminGrantedLicense',
  sendLibraryUserMessage: 'sendLibraryUserMessage',
  // reader app - groups, licenses, invites
  createGroup: 'createGroup',
  requestToJoinGroup: 'requestToJoinGroup',
  approveGroupMembership: 'approveGroupMembership',
  rejectGroupMembership: 'rejectGroupMembership',
  closeMyGroup: 'closeMyGroup',
  sendGroupInvite: 'sendGroupInvite',
  cancelGroupInvite: 'cancelGroupInvite',
  purchaseGroupLicenses: 'purchaseGroupLicenses',
  assignGroupLicense: 'assignGroupLicense',
  revokeGroupLicense: 'revokeGroupLicense',
  leaveGroupAndRevokeLicense: 'leaveGroupAndRevokeLicense',
  copyGroupMembers: 'copyGroupMembers',
  getInviteDetails: 'getInviteDetails',
  declineGroupInvite: 'declineGroupInvite',
  acceptGroupInvite: 'acceptGroupInvite',
  // reader app - profile, store
  verifyAndGrantReaderStorePurchase: 'verifyAndGrantReaderStorePurchase',
  deleteMyAccount: 'deleteMyAccount',
  recordMyLogin: 'recordMyLogin',
  createMyReaderProfile: 'createMyReaderProfile',
  updateMyPreferences: 'updateMyPreferences',
  lookupCoupon: 'lookupCoupon',
} as const;

/** Firestore/scheduled triggers - not client-callable; listed so the
 *  drift test can require index.ts to match the contract exactly. */
export const TRIGGER_FUNCTIONS = {
  onEventRegistrationCreated: 'onEventRegistrationCreated',
  onEventRegistrationUpdated: 'onEventRegistrationUpdated',
  onFormSubmissionCreated: 'onFormSubmissionCreated',
  onFormSubmissionUpdated: 'onFormSubmissionUpdated',
  onPurchaseCreated: 'onPurchaseCreated',
  onPurchaseUpdated: 'onPurchaseUpdated',
  onPurchaseFulfillmentEligible: 'onPurchaseFulfillmentEligible',
  onPurchaseCustomerUpsert: 'onPurchaseCustomerUpsert',
  onEventRegistrationCustomerUpsert: 'onEventRegistrationCustomerUpsert',
  campaignSendScheduler: 'campaignSendScheduler',
  onCampaignMailDelivered: 'onCampaignMailDelivered',
  onTranslationLocaleRegistry: 'onTranslationLocaleRegistry',
  onPurchaseGrantLibraryLicenses: 'onPurchaseGrantLibraryLicenses',
  notifyGroupChatMessage: 'notifyGroupChatMessage',
  notifyConversationMessage: 'notifyConversationMessage',
  onGroupMembershipCountChanged: 'onGroupMembershipCountChanged',
  notifyJoinRequestActivity: 'notifyJoinRequestActivity',
  notifyPrayerRequestShared: 'notifyPrayerRequestShared',
  onAdminUserRoleSync: 'onAdminUserRoleSync',
  onPurchaseTaxSummary: 'onPurchaseTaxSummary',
  onEventRegistrationSessionCounts: 'onEventRegistrationSessionCounts',
} as const;

export type HttpFunctionName = (typeof HTTP_FUNCTIONS)[keyof typeof HTTP_FUNCTIONS];
export type CallableFunctionName = (typeof CALLABLE_FUNCTIONS)[keyof typeof CALLABLE_FUNCTIONS];
export type TriggerFunctionName = (typeof TRIGGER_FUNCTIONS)[keyof typeof TRIGGER_FUNCTIONS];
export type FunctionName = HttpFunctionName | CallableFunctionName | TriggerFunctionName;

/** Every deployed function name, for tooling (deploy allow-lists, tests). */
export const ALL_FUNCTION_NAMES: readonly FunctionName[] = [
  ...Object.values(HTTP_FUNCTIONS),
  ...Object.values(CALLABLE_FUNCTIONS),
  ...Object.values(TRIGGER_FUNCTIONS),
];
