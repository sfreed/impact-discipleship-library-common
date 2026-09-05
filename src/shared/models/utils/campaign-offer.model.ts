import { Timestamp } from 'firebase/firestore';
import { BaseModel } from '../base.model';
import { toMillis } from '../../utils/date-from-timestamp';
import { round2 } from '../../lists/money';

// A campaign's OFFER (Campaign Manager v3, 2026-08-22). One shape for every
// campaign type: the campaign's TYPE decides what its starter content looks
// like, the OFFER decides pricing. Replaces the v2 `sales` collection, whose
// single global percentage overwrote every product's price and silently
// ignored any second active sale.
//
// Lives in its own PUBLIC-READABLE collection (`campaign_offers`, doc id ==
// campaignId) for the same reason `campaign_popups` does: campaign docs are
// staff-only and stay that way, so the storefront can never read one. Whatever
// a shopper's price depends on has to be published here.
//
// NEVER put audience, stats or coupon codes on this doc - it is world-readable
// by design, exactly like the popup doc.
export type OfferTargetKind = 'product' | 'series' | 'event';

// 'percentOff' takes a percentage off the base price. 'fixedPrice' IS the new
// price, not an amount deducted - the event early-bird shape ("$79 early bird,
// $99 regular"). Named for what they DO because "flat" reads equally well as
// "flat amount off", and that misreading would take $79 off a $99 event
// instead of charging $79 for it.
export type OfferDiscountType = 'percentOff' | 'fixedPrice';

export interface OfferTarget {
  kind: OfferTargetKind;
  // products/{id}, series/{id} or events/{id}. A 'series' target covers every
  // product whose own `series` field matches - INCLUDING products added to the
  // series after the campaign went live. That is deliberate (a new book in a
  // discounted series joins the sale on its own) and is also the one conflict
  // activation-time checking cannot catch.
  id: string;
}

export interface OfferDiscount {
  type: OfferDiscountType;
  value: number;
}

export class CampaignOfferModel extends BaseModel {
  campaignId = '';
  target!: OfferTarget;
  discount!: OfferDiscount;

  // Free shipping on the WHOLE order when the cart holds a qualifying product.
  // Shipping is quoted once per order from total cart weight, so there is no
  // per-product shipping cost to zero out.
  freeShipping = false;

  // The offer's OWN window, copied from the campaign at publish time. The
  // storefront cannot ask "is that campaign still live" - it has to be told.
  // A null endsAt means the campaign is open-ended. The End Campaign cascade
  // writes isActive:false through to here.
  isActive = false;
  startsAt?: Timestamp | Date | string | null;
  endsAt?: Timestamp | Date | string | null;

  // true  = apply only for a visitor whose stored attribution names this
  //         campaign (the event early-bird rule - a reward for being on the
  //         list). Attribution persists 30 days in localStorage, captured at
  //         bootstrap before the router can wipe the query string.
  // false = public; every visitor sees it.
  requiresAttribution = false;
}

// What an offer is being tested against. Products carry their series so a
// 'series' target resolves without a second lookup - `series` is a plain
// string field on the product, which is why series targeting stays cheap.
export interface OfferSubject {
  kind: 'product' | 'event';
  id: string;
  series?: string | null;
}


/**
 * The price this discount produces from a base price.
 *
 * Rounds to cents, which the v2 global sale did NOT - it computed
 * `cost - (percentOff / 100 * cost)` raw, so 15% off $22.99 became
 * 19.541499999999996 and every downstream total carried the tail.
 */
export const offerPrice = (basePrice: number, discount: OfferDiscount): number => {
  const base = Number.isFinite(basePrice) ? basePrice : 0;

  if (discount?.type === 'fixedPrice') {
    return round2(Math.max(0, discount.value ?? 0));
  }

  const percent = Math.min(100, Math.max(0, discount?.value ?? 0));
  return round2(Math.max(0, base - (base * percent) / 100));
};

/** Whether the offer's own window is open at `now`. */
const withinWindow = (offer: CampaignOfferModel, now: number): boolean => {
  const startsAt = offer.startsAt ? toMillis(offer.startsAt) : 0;
  const endsAt = offer.endsAt ? toMillis(offer.endsAt) : 0;

  if (startsAt > 0 && startsAt > now) {
    return false;
  }
  // No end date = open-ended, which is the normal state for a long-running
  // series - see the campaign model's own endDate comment.
  return endsAt === 0 || endsAt >= now;
};

/** Whether the offer's target names this subject. */
const targets = (offer: CampaignOfferModel, subject: OfferSubject): boolean => {
  const target = offer.target;
  if (!target?.id) {
    return false;
  }

  if (target.kind === 'series') {
    return subject.kind === 'product' && !!subject.series && subject.series === target.id;
  }
  if (target.kind === 'product') {
    return subject.kind === 'product' && subject.id === target.id;
  }
  return subject.kind === 'event' && subject.id === target.id;
};

/**
 * Whether this offer applies to this subject right now.
 *
 * The SAME function serves the admin's preview and the storefront's pricing,
 * so a preview cannot disagree with what a shopper is charged - the principle
 * previewCampaignAudience already established for audiences.
 *
 * @param attributedCampaignId The campaign named by the visitor's stored
 *   attribution, if any. Only consulted when the offer requires it.
 */
export const offerApplies = (
  offer: CampaignOfferModel,
  subject: OfferSubject,
  now: number,
  attributedCampaignId?: string | null
): boolean => {
  if (!offer?.isActive || !withinWindow(offer, now)) {
    return false;
  }
  if (offer.requiresAttribution && attributedCampaignId !== offer.campaignId) {
    return false;
  }
  return targets(offer, subject);
};

/**
 * The best price among competing offers, or null when none apply.
 *
 * Two live campaigns CAN discount the same item - the conflict check warns on
 * activation but never blocks, and a product moved into a discounted series
 * enrols itself with nobody touching either campaign. So the read path must
 * always be prepared for more than one match, and resolves it in the shopper's
 * favour rather than picking the first one found (which is what the v2 sale
 * lookup did).
 */
export const bestOfferPrice = (
  offers: CampaignOfferModel[],
  subject: OfferSubject,
  basePrice: number,
  now: number,
  attributedCampaignId?: string | null
): number | null => {
  const prices = (offers ?? [])
    .filter((offer) => offerApplies(offer, subject, now, attributedCampaignId))
    .map((offer) => offerPrice(basePrice, offer.discount));

  return prices.length ? Math.min(...prices) : null;
};

/** Whether any applicable offer grants free shipping. */
export const grantsFreeShipping = (
  offers: CampaignOfferModel[],
  subject: OfferSubject,
  now: number,
  attributedCampaignId?: string | null
): boolean =>
  (offers ?? []).some(
    (offer) => offer.freeShipping && offerApplies(offer, subject, now, attributedCampaignId)
  );
