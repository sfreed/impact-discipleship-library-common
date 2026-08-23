import { GeocodingService } from './geocoding.service';

// Nominatim answers an unmatched street with an EMPTY ARRAY, not an error,
// so the street-level miss is silent. Before the city-level fallback, that
// silence meant every group whose leader typed an imperfect address stored
// no lat/lng and could never appear in a radius search - confirmed against
// real data by scripts/audit-group-locations.js (admin repo), which found
// zero groups with coordinates.
describe('GeocodingService', () => {
  let service: GeocodingService;
  let calls: string[];

  /** Stubs fetch with one canned response per successive call. */
  function stubFetch(...responses: Array<{ ok?: boolean; body?: unknown }>) {
    let i = 0;
    spyOn(globalThis, 'fetch').and.callFake(((url: string) => {
      calls.push(String(url));
      const next = responses[i++] ?? { ok: true, body: [] };
      return Promise.resolve({
        ok: next.ok !== false,
        json: () => Promise.resolve(next.body ?? []),
      } as Response);
    }) as typeof fetch);
  }

  const hit = [{ lat: '33.3806716', lon: '-84.7996573' }];
  const query = { address1: 'highway 1 campus', city: 'Newnan', state: 'GA', countryCode: 'US' };

  beforeEach(() => {
    service = new GeocodingService();
    calls = [];
  });

  it('returns the street-level result and does not retry when it hits', async () => {
    stubFetch({ body: hit });
    await expectAsync(service.geocode(query)).toBeResolvedTo({ lat: 33.3806716, lng: -84.7996573 });
    expect(calls.length).toBe(1);
    expect(calls[0]).toContain('street=');
  });

  it('falls back to a city-level lookup when the street does not match', async () => {
    // The exact real-world case: Nominatim returns [] for the street, then
    // resolves the town on the second attempt.
    stubFetch({ body: [] }, { body: hit });
    await expectAsync(service.geocode(query)).toBeResolvedTo({ lat: 33.3806716, lng: -84.7996573 });
    expect(calls.length).toBe(2);
    expect(calls[0]).toContain('street=');
    expect(calls[1]).not.toContain('street=');
    // The fallback must keep the other narrowing, or it resolves the wrong
    // Newnan in some other state.
    expect(calls[1]).toContain('city=Newnan');
    expect(calls[1]).toContain('state=GA');
    expect(calls[1]).toContain('countrycodes=us');
  });

  it('falls back when the street lookup errors rather than misses', async () => {
    stubFetch({ ok: false }, { body: hit });
    await expectAsync(service.geocode(query)).toBeResolvedTo({ lat: 33.3806716, lng: -84.7996573 });
    expect(calls.length).toBe(2);
  });

  it('does not retry when there was no address to begin with', async () => {
    // An online-only or city-only group already sent the city-level query;
    // repeating it verbatim would just be a second useless round trip.
    stubFetch({ body: [] });
    await expectAsync(
      service.geocode({ city: 'Newnan', state: 'GA', countryCode: 'US' }),
    ).toBeResolvedTo(undefined);
    expect(calls.length).toBe(1);
  });

  it('resolves undefined when even the city cannot be found', async () => {
    stubFetch({ body: [] }, { body: [] });
    await expectAsync(service.geocode(query)).toBeResolvedTo(undefined);
    expect(calls.length).toBe(2);
  });

  it('never throws when fetch itself rejects', async () => {
    // A failed geocode must degrade to "no coordinates", never block a create.
    spyOn(globalThis, 'fetch').and.returnValue(Promise.reject(new Error('offline')));
    await expectAsync(service.geocode(query)).toBeResolvedTo(undefined);
  });

  it('rejects an unparsable coordinate rather than storing NaN', async () => {
    stubFetch({ body: [{ lat: 'not-a-number', lon: 'nope' }] }, { body: hit });
    await expectAsync(service.geocode(query)).toBeResolvedTo({ lat: 33.3806716, lng: -84.7996573 });
  });

  it('omits state for a non-US query', async () => {
    stubFetch({ body: hit });
    await service.geocode({ address1: '10 High St', city: 'Oxford', countryCode: 'GB' });
    expect(calls[0]).toContain('countrycodes=gb');
    expect(calls[0]).not.toContain('state=');
  });
});
