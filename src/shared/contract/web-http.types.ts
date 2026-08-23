// Request/response contract of the public HTTP (onRequest) functions the
// web site calls by URL (HTTP_FUNCTIONS.*): PayPal checkout, event
// registration, newsletter/prayer subscribe, coupon lookup, session counts,
// newsletter archive, YouTube feed. ONE copy (Stage 2e-ii group 4,
// 2026-08-20): the web app types its fetch() wrappers with these and the
// functions type their request-body casts with the same <name>Request.
// <name>Request = JSON body the client POSTs; <name>Result = JSON the
// function responds with on success (error responses are {code?, error}).
// Results that embed a Firestore document (the purchase CheckoutForm, an
// event registration) take it as a type parameter - those models import the
// client firebase SDK and can't be referenced from functions/. Strict-clean.

/** Campaign attribution the web app attaches to conversions (see its
 *  AttributionService) - advisory; the functions validate the campaign. */
export interface AttributionInput {
  campaignId: string;
  emailId?: string;
  source?: string;
}

// ------------------------------------------------------------- checkout

export interface CheckoutCartItemInput {
  id: string;
  isEvent?: boolean;
  isEBook?: boolean;
  isDigitalBook?: boolean;
  orderQuantity: number;
  size?: string;
  color?: string;
  language?: string;
  attendees?: unknown[];
  followUpEmailId?: string;
}

/** create_paypal_order - the server recomputes every price from Firestore;
 *  the client only sends ids/quantities/selections + buyer details. */
export interface CreatePaypalOrderRequest {
  cartItems: CheckoutCartItemInput[];
  couponCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: unknown;
  isNewsletter?: boolean;
  isShippingSameAsBilling?: boolean;
  billingAddress?: unknown;
  shippingAddress?: unknown;
  shippingRate?: number;
  shippingRateId?: unknown;
  attribution?: AttributionInput;
}
export interface CreateOrderBreakdown {
  subtotal: number;
  totalDiscount: number;
  estimatedTaxes: number;
  taxRate: number;
  taxSource: string;
  shippingDiscount: number;
  shippingDiscountReason: string;
  total: number;
}
/** `free: true` = a $0/coupon order was written directly (checkoutForm
 *  set); otherwise a real PayPal order was created (orderId set). */
export interface CreatePaypalOrderResult<TCheckoutForm = unknown> {
  free: boolean;
  checkoutForm?: TCheckoutForm;
  orderId?: string;
  breakdown?: CreateOrderBreakdown;
}

export interface CapturePaypalOrderRequest {
  orderId: string;
  payerID?: string;
}
export interface CapturePaypalOrderResult<TCheckoutForm = unknown> {
  checkoutForm?: TCheckoutForm;
  /** Payment captured but the purchase doc write failed - support case. */
  recordingFailed?: boolean;
  errorCode?: string;
  payPalOrderId?: string;
}

export interface LookupCouponHttpRequest {
  code: string;
}

// ------------------------------------------------------ event registration

export interface RegisterForEventRequest {
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
  /** PayPal receipt / coupon code when the registration came through checkout. */
  receipt?: string;
  attribution?: AttributionInput;
}
export interface RegisterForEventResult {
  registrationId: string;
  receiptEmailId?: string;
}

export interface GetEventRegistrationRequest {
  registrationId: string;
}
export interface GetEventRegistrationResult<TRegistration = unknown> {
  /** The registration with its date serialized as ISO (registrationDateIso). */
  registration: (TRegistration & { registrationDateIso?: string }) | null;
}

export interface UpdateMySessionsRequest {
  registrationId: string;
  /** Agenda-item id of the breakout session. */
  sessionId: string;
  action: 'add' | 'remove';
}
export interface UpdateMySessionsResult {
  trainingSessions: string[];
}

export interface CheckRegistrationExistsRequest {
  eventId: string;
  email: string;
}
export interface CheckRegistrationExistsResult {
  exists: boolean;
}

export interface GetSessionCountsRequest {
  eventId: string;
}
export interface GetSessionCountsResult {
  /** agendaItemId -> registered count (clamped to capacity). */
  counts: Record<string, number>;
}

// ------------------------------------------------------------ subscribe

export type SubscriptionType = 'newsletter' | 'prayer';
export interface SubscribeToEmailListRequest {
  type: SubscriptionType;
  firstName: string;
  lastName: string;
  email: string;
  attribution?: AttributionInput;
}
export interface SubscribeToEmailListResult {
  subscribed: boolean;
  alreadySubscribed: boolean;
}

// ------------------------------------------------- public content feeds

/** newsletter_archive (GET, no id): the list. GET ?id=<touch id> returns
 *  the issue's HTML as text/html. */
export interface NewsletterArchiveListResult {
  newsletters: Array<{ id: string; title: string; date: string | null }>;
}

/** get_youtube_videos_public (GET): the channel playlist's raw YouTube Data
 *  API playlistItems, passed through untouched (the function only hides
 *  the API key) - hence unknown[]; the web's podcast pages read
 *  snippet.title / snippet.resourceId.videoId etc. off them. */
export interface GetYoutubeVideosResult {
  videos: unknown[];
}

/** One episode as get_youtube_podcasts_public returns it: already
 *  normalized, so a client never has to know the YouTube payload shape.
 *  Unlike GetYoutubeVideosResult above (raw playlistItems), this carries
 *  `tags` - YouTube only exposes snippet.tags on the *videos* resource, so
 *  producing this costs a second API call the passthrough never made. */
export interface YoutubePodcast {
  /** playlistItem id - stable per episode, used as the list track key. */
  id: string;
  videoId: string;
  title: string;
  description: string;
  /** ISO 8601, straight from snippet.publishedAt. */
  publishedAt: string;
  /** Best available: maxres, else standard, else high. */
  thumbnailUrl: string;
  /** The video's YouTube tags; empty when none are set in YouTube Studio. */
  tags: string[];
}

/** get_youtube_podcasts_public (GET): the podcast playlist, newest first,
 *  server-side cached. Note the list can be served stale on a YouTube
 *  outage - showing the last known episodes beats an empty page. */
export interface GetYoutubePodcastsResult {
  videos: YoutubePodcast[];
}

/** campaign_web_event (GET beacon): ?cid=<campaignId>&type=<event>; 204. */
export type CampaignWebEventType = 'web_shown' | 'web_click';

// -------------------------------------------- public Impact Group finder

/** search_impact_groups - the ONLY anonymous read path onto
 *  `discussionGroups`. firestore.rules gates every group read behind
 *  signedIn(), and the public web site has no Firebase Auth at all, so the
 *  finder cannot query Firestore directly.
 *
 *  This is a deliberately narrow PROJECTION, not the stored document. What
 *  it must never carry, and why:
 *   - `onlineInfo`: free text that in practice holds meeting links and
 *     passwords. Publishing it hands anyone a way into a private meeting.
 *   - `creatorEmail` and anything from the `members` subcollection: PII,
 *     and never needed to decide whether to join.
 *   - `address1` unless the leader set `addressVisible` - that flag is the
 *     leader's recorded choice and this endpoint honours it exactly.
 *  Leader identity is reduced to a display label ("Matthew F.") so a public,
 *  indexable page never ties a full name to a meeting place and time.
 *
 *  Sent as query-string params (a GET, so hosting/CDN can cache it), not a
 *  JSON body - hence every field here is the parsed shape, not the raw
 *  string the client puts on the URL. */
export interface SearchImpactGroupsRequest {
  /** Free text matched against title, city, state code and state name. */
  q?: string;
  bookId?: string;
  meeting?: 'in-person' | 'online' | 'hybrid';
  /** Viewer coordinates for a radius search. Both required, or neither. */
  lat?: number;
  lng?: number;
  /** Radius in miles. Ignored unless lat/lng are both present. */
  radiusMi?: number;
  /** Only groups starting within this many days. */
  startsWithin?: number;
  limit?: number;
  /** Opaque continuation token from a previous result's `nextCursor`. */
  cursor?: string;
}

/** One group as the public site sees it. Every optional field is absent
 *  rather than null when it does not apply, matching how the stored
 *  document omits rather than nulls. */
export interface PublicGroupSummary {
  id: string;
  title: string;
  description?: string;
  bookId: string;
  /** Resolved server-side from librarySeries/{s}/books/{b} - the web app
   *  has no signed-in read access to book metadata either. */
  bookTitle?: string;
  /** Derived, never stored - see the group's location/onlineInfo fields. */
  meetingType: 'in-person' | 'online' | 'hybrid';
  city?: string;
  /** USPS two-letter code; present only for US groups. */
  state?: string;
  /** ISO 3166-1 alpha-2. */
  country?: string;
  /** Present only when the leader opted to show it. */
  address1?: string;
  /** Published so the client can sort and filter by distance. Stored even
   *  for a hidden address precisely so search works - only display code
   *  ever checks address visibility. */
  lat?: number;
  lng?: number;
  /** Epoch ms. */
  startDate: number;
  /** IANA zone id. Absent on groups created before the field existed; the
   *  client then falls back to the viewer's own zone. */
  startTimeZone?: string;
  /** First name + last initial, e.g. "Matthew F." */
  leaderLabel: string;
  /** Absent when the group has no cap. */
  spotsLeft?: number;
  /** The advertised cap, excluding the leader. Absent when uncapped.
   *  Published so the finder can render "3 of 12 spots left" - it is the
   *  group's own advertised size, not member data. */
  maxMembers?: number;
  /** Miles from the requested lat/lng. Present only on a radius search. */
  distanceMi?: number;
}

export interface SearchImpactGroupsResult {
  groups: PublicGroupSummary[];
  /** Total matching the filters, which may exceed `groups.length`. */
  total: number;
  /** Absent when there are no further pages. */
  nextCursor?: string;
}
