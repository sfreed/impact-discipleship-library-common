import {
  CampaignOfferModel,
  OfferSubject,
  bestOfferPrice,
  grantsFreeShipping,
  offerApplies,
  offerPrice
} from './campaign-offer.model';

// These four functions are the whole pricing contract for Campaign Manager v3,
// and they are shared verbatim between the admin's preview and the storefront's
// checkout - so what is pinned here is what a shopper is CHARGED, not just what
// a screen renders.
//
// The cases worth having are the ones v2 got wrong: unrounded percentages, a
// first-match-wins lookup that ignored competing sales, and a global sale that
// applied to products nobody selected.

const NOW = Date.UTC(2026, 7, 22);
const DAY = 24 * 60 * 60 * 1000;

function anOffer(extra: Partial<CampaignOfferModel> = {}): CampaignOfferModel {
  return {
    campaignId: 'camp-1',
    target: { kind: 'product', id: 'prod-1' },
    discount: { type: 'percentOff', value: 20 },
    freeShipping: false,
    isActive: true,
    startsAt: null,
    endsAt: null,
    requiresAttribution: false,
    ...extra
  } as CampaignOfferModel;
}

const aProduct = (extra: Partial<OfferSubject> = {}): OfferSubject =>
  ({ kind: 'product', id: 'prod-1', ...extra });

const anEvent = (extra: Partial<OfferSubject> = {}): OfferSubject =>
  ({ kind: 'event', id: 'evt-1', ...extra });

describe('offerPrice', () => {
  it('takes a percentage off the base price', () => {
    expect(offerPrice(100, { type: 'percentOff', value: 20 })).toBe(80);
  });

  it('rounds to cents, which the v2 global sale did not', () => {
    // 15% off 22.99 is 19.541499999999996 in raw floating point.
    expect(offerPrice(22.99, { type: 'percentOff', value: 15 })).toBe(19.54);
  });

  it('treats fixedPrice as the NEW price, never an amount deducted', () => {
    // The bug this naming exists to prevent: a 79 early bird on a 99 event
    // must charge 79, not 99 minus 79.
    expect(offerPrice(99, { type: 'fixedPrice', value: 79 })).toBe(79);
  });

  it('clamps a percentage above 100 rather than paying the shopper', () => {
    expect(offerPrice(50, { type: 'percentOff', value: 150 })).toBe(0);
  });

  it('never returns a negative price', () => {
    expect(offerPrice(10, { type: 'fixedPrice', value: -5 })).toBe(0);
  });
});

describe('offerApplies', () => {
  it('applies to the product its target names', () => {
    expect(offerApplies(anOffer(), aProduct(), NOW)).toBeTrue();
  });

  it('does not apply to a different product', () => {
    expect(offerApplies(anOffer(), aProduct({ id: 'prod-2' }), NOW)).toBeFalse();
  });

  it('applies to every product in a targeted series', () => {
    const offer = anOffer({ target: { kind: 'series', id: 'ser-1' } });
    expect(offerApplies(offer, aProduct({ id: 'any', series: 'ser-1' }), NOW)).toBeTrue();
  });

  it('does not apply to a product outside the targeted series', () => {
    const offer = anOffer({ target: { kind: 'series', id: 'ser-1' } });
    expect(offerApplies(offer, aProduct({ series: 'ser-2' }), NOW)).toBeFalse();
  });

  it('does not treat a product with no series as a series match', () => {
    const offer = anOffer({ target: { kind: 'series', id: 'ser-1' } });
    expect(offerApplies(offer, aProduct({ series: null }), NOW)).toBeFalse();
  });

  it('never applies a product offer to an event, or the reverse', () => {
    expect(offerApplies(anOffer(), anEvent(), NOW)).toBeFalse();

    const eventOffer = anOffer({ target: { kind: 'event', id: 'prod-1' } });
    expect(offerApplies(eventOffer, aProduct(), NOW)).toBeFalse();
  });

  describe('window', () => {
    it('is off before it starts', () => {
      expect(offerApplies(anOffer({ startsAt: new Date(NOW + DAY) }), aProduct(), NOW)).toBeFalse();
    });

    it('is off after it ends', () => {
      expect(offerApplies(anOffer({ endsAt: new Date(NOW - DAY) }), aProduct(), NOW)).toBeFalse();
    });

    it('stays on with no end date - the open-ended series case', () => {
      expect(offerApplies(anOffer({ endsAt: null }), aProduct(), NOW)).toBeTrue();
    });

    it('is off when the campaign was ended, whatever the dates say', () => {
      // What the End Campaign cascade writes through.
      expect(offerApplies(anOffer({ isActive: false }), aProduct(), NOW)).toBeFalse();
    });
  });

  describe('attribution gate', () => {
    it('applies to anyone when attribution is not required', () => {
      expect(offerApplies(anOffer(), aProduct(), NOW, null)).toBeTrue();
    });

    it('applies only to a visitor attributed to THIS campaign', () => {
      const offer = anOffer({ requiresAttribution: true });
      expect(offerApplies(offer, aProduct(), NOW, 'camp-1')).toBeTrue();
    });

    it('withholds the price from an unattributed visitor', () => {
      const offer = anOffer({ requiresAttribution: true });
      expect(offerApplies(offer, aProduct(), NOW, null)).toBeFalse();
    });

    it('withholds the price from a visitor attributed to another campaign', () => {
      const offer = anOffer({ requiresAttribution: true });
      expect(offerApplies(offer, aProduct(), NOW, 'camp-2')).toBeFalse();
    });
  });
});

describe('bestOfferPrice', () => {
  it('returns null when nothing applies, so the base price stands', () => {
    expect(bestOfferPrice([anOffer({ isActive: false })], aProduct(), 100, NOW)).toBeNull();
  });

  it('resolves competing offers in the shopper favour, not first-match', () => {
    // v2 took the FIRST active sale it found and ignored the rest. Two live
    // campaigns can legitimately reach the same product - the conflict check
    // warns on activation but never blocks.
    const offers = [
      anOffer({ campaignId: 'camp-1', discount: { type: 'percentOff', value: 10 } }),
      anOffer({ campaignId: 'camp-2', discount: { type: 'percentOff', value: 30 } })
    ];
    expect(bestOfferPrice(offers, aProduct(), 100, NOW)).toBe(70);
  });

  it('ignores offers that do not apply when picking the best', () => {
    const offers = [
      anOffer({ campaignId: 'camp-1', discount: { type: 'percentOff', value: 10 } }),
      anOffer({ campaignId: 'camp-2', discount: { type: 'percentOff', value: 90 }, isActive: false })
    ];
    expect(bestOfferPrice(offers, aProduct(), 100, NOW)).toBe(90);
  });

  it('lets a product-targeted offer beat a series-targeted one', () => {
    const offers = [
      anOffer({ target: { kind: 'series', id: 'ser-1' }, discount: { type: 'percentOff', value: 10 } }),
      anOffer({ target: { kind: 'product', id: 'prod-1' }, discount: { type: 'percentOff', value: 25 } })
    ];
    expect(bestOfferPrice(offers, aProduct({ series: 'ser-1' }), 100, NOW)).toBe(75);
  });

  it('handles an empty list', () => {
    expect(bestOfferPrice([], aProduct(), 100, NOW)).toBeNull();
  });
});

describe('grantsFreeShipping', () => {
  it('is granted by an applicable offer that carries it', () => {
    expect(grantsFreeShipping([anOffer({ freeShipping: true })], aProduct(), NOW)).toBeTrue();
  });

  it('is not granted by an offer that does not apply', () => {
    const offer = anOffer({ freeShipping: true, isActive: false });
    expect(grantsFreeShipping([offer], aProduct(), NOW)).toBeFalse();
  });

  it('is not granted when the applicable offer does not carry it', () => {
    expect(grantsFreeShipping([anOffer()], aProduct(), NOW)).toBeFalse();
  });
});
