import { BaseModel } from "../base.model";
import { Address } from "../domain/utils/address.model";

export class WebConfigModel extends BaseModel{
  // FOUR FIELDS LEFT THIS MODEL on 2026-08-31, after an audit traced every
  // one of them across the web app, the admin, the reader and the Cloud
  // Functions and found nothing reading them:
  //
  //   countdownEndDateTime  the home page countdown takes its date from the
  //                         summit event, never from here
  //   images                a list of urls nothing drew
  //   adminEmailAddress     a box on the form; no email was ever sent to it
  //   taxImportDate         converted from a Timestamp on every read and
  //                         then never looked at
  //
  // Dropped from the dev document by scripts/web-config-cleanup.js. Every
  // one was a box somebody could fill in, save, and watch change nothing.
  policy: string;
  tos: string
  email: string;
  phone: string;
  address: Address;
  /**
   * The site header's image.
   *
   * READ BY THE HEADER since 2026-08-31. Until then the header drew a
   * hardcoded url out of impact-disciples.data.ts and this field did
   * nothing at all - so changing the logo here changed nothing, and the
   * address and phone number in that same file silently disagreed with
   * the ones below. That file is deleted; this is the only copy.
   */
  logo: string;
  twitter: string | null;
  facebook: string | null;
  facebookLive: string | null;
  applePodCast: string | null;
  linkedIn: string | null;
  youtube: string | null;
  instagram: string | null ;
  inpersonSeminarCost: number;
  onlineSeminarCost: number;
  equippingGroupTotalCost: number;
  equippingGroupPaymentCost: number;
  // Recipient(s) for the daily "locked-out patron" alert - a scheduled
  // function (lockedOutPatronAlert) emails here when a reader has a
  // libraryUsers profile but no Firebase Auth account, i.e. cannot sign in.
  // Comma-separated for multiple. Blank falls back to a hardcoded default in
  // the function. Fine to keep in this world-readable config: it is a contact
  // address, not a secret (same rule as paypalClientId below).
  lockedOutAlertEmail?: string;
  freeShippingAmount: number;
  // paypalClientId is a public client identifier, safe to keep here. Secrets
  // are not: `config` is world-readable under the current firestore.rules, so
  // anything stored here is effectively published. The apilayer tax key used
  // to live on this model and now comes from Secret Manager (TAX_API_KEY) in
  // checkout-pricing.functions.ts instead. House rule: keys never go in
  // Firestore.
  paypalClientId?: string;
  // PUBLIC social identity for the campaign social composer's previews and
  // manual posting (page name / @handles only). Same rule as paypalClientId
  // above: this config is world-readable, so social API tokens/secrets must
  // never go here - a future auto-publish phase keeps them in Secret
  // Manager on the functions side.
  socialFacebookPageName?: string | null;
  socialTwitterHandle?: string | null;
  socialInstagramHandle?: string | null;
}
