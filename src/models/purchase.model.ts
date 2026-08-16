// Shared Purchase shape - impact-discipleship-library-new (patron checkout,
// write-only) and impact-discipleship-library-manager-new (admin search/
// revoke) both read/write the same `purchases` collection. `processedStatus`/
// `revocations` are only ever written by the manager app's `revokePurchase`
// Cloud Function; the reader app only ever creates a purchase as 'NEW' and
// never updates it (firestore.rules make `purchases` update-blocked from any
// client).

export interface PurchaseCartItem {
  /** The legacy product's own id - provenance only, not used to grant access. */
  id: string;
  itemName: string;
  price: number;
  salePrice?: number;
  /** 1 for a normal Store purchase (a book license bought once, not
   *  per-unit) - kept for shape parity with the reference's CartItem. Can be
   *  >1 for a group leader's bulk license purchase (`purchaseGroupLicenses`),
   *  the one path that buys more than one license of the same book in a
   *  single purchase. */
  orderQuantity: number;
  discount?: number;
  /** Per-unit price after the coupon discount, i.e. (salePrice||price) - discount. */
  discountPrice?: number;
  isDigitalBook: true;
  /** The id written into LibraryUser.licensedBookIds/bookLicenses, and what
   *  revokePurchase removes from there. */
  digitalBookId: string;
  img?: { url: string; name?: string };
  language?: string;
}

export type PurchaseReceipt = 'COUPON' | 'FREE ONLY' | (string & {});

/** One admin's revoke action against a purchase - a bundled purchase can be
 *  partially refunded in more than one step (possibly by different admins),
 *  so this is an append-only history, not a single "last revoked" snapshot. */
export interface PurchaseRevocation {
  /** digitalBookIds revoked together in this one call. */
  bookIds: string[];
  revokedAt: number;
  /** uid of the admin who performed this specific revoke. */
  revokedBy: string;
  /** PayPal's refund id, set only when this action actually called PayPal's
   *  refund API - see revokePurchase's `skipsPaypal` logic. Absent for a
   *  COUPON/FREE ONLY purchase (nothing to refund), or when the admin
   *  unchecked "Also refund via PayPal" because they'd already refunded
   *  manually in PayPal's dashboard. */
  paypalRefundId?: string;
  /** Dollar amount refunded via PayPal for this action specifically (partial
   *  for a partial revoke) - absent whenever paypalRefundId is absent. */
  refundedAmount?: number;
}

export interface Purchase {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userId: string;
  cartItems: PurchaseCartItem[];
  couponCode?: string;
  couponPercent?: number;
  /** Sum of effective (salePrice||price) across cartItems, before discount. */
  subtotal: number;
  /** Total discount amount across cartItems. */
  discount: number;
  /** Amount actually due/charged - subtotal - discount. */
  total: number;
  /** PayPal order id, or the sentinels 'COUPON' (100%-off coupon) / 'FREE
   *  ONLY' (naturally zero, no coupon involved). */
  receipt: PurchaseReceipt;
  /** 'REFUNDED' only once every cartItem's digitalBookId is covered by
   *  `revocations` - see revokePurchase. A partial revoke leaves this 'NEW'
   *  with a non-empty `revocations`; flatten `revocations[].bookIds` and
   *  compare its length against `cartItems`' to distinguish "not refunded"
   *  from "partially refunded" in the UI.
   *
   *  'PENDING_MANUAL_REVIEW': a $0/coupon claim
   *  verifyAndGrantReaderStorePurchase could NOT independently verify
   *  (coupon validity lives in a project this app's Cloud Functions have no
   *  cross-project access to yet) - no license was granted automatically;
   *  an admin follows up via grantLibraryUserLicenses after checking the
   *  errorLogs entry the function also writes. */
  processedStatus: 'NEW' | 'REFUNDED' | 'PENDING_MANUAL_REVIEW';
  dateProcessed: number;
  createdAt: number;
  /** Append-only history of revoke actions against this purchase - see
   *  PurchaseRevocation. Absent until the first revoke. */
  revocations?: PurchaseRevocation[];
  /** Which PayPal environment this purchase's `receipt` order id belongs to -
   *  set by the reader app's StoreComponent.completePurchase() at creation
   *  time based on whether environment.paypalClientId (the dev-only sandbox
   *  override) was active. Read by revokePurchase to pick which Secret
   *  Manager credential/API host to refund against. Absent on purchases
   *  created before this field existed - revokePurchase treats that as
   *  'live'. */
  paypalEnvironment?: 'sandbox' | 'live';
  /** The PayPal capture id underlying `receipt` (a PayPal order id), cached
   *  by revokePurchase after its first order lookup so a later partial
   *  revoke of the same purchase doesn't repeat it. Never set by anything
   *  else. */
  paypalCaptureId?: string;
  /** Generated once by the reader app's StoreComponent when a PayPal
   *  checkout begins (see completePurchase), stored here so the manager
   *  app's revokePurchase can read it back and reuse it for its own
   *  PayPal-related error logging on a later refund - one id ties together
   *  a purchase's whole PayPal lifecycle, initial charge through any
   *  refund. See @impact-common/errors/correlation-id. */
  correlationId?: string;
}
