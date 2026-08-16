import { Injectable } from '@angular/core';

const LOOKUP_URL = 'https://nominatim.openstreetmap.org/search';
const LOOKUP_TIMEOUT_MS = 8000;

export interface GeocodeQuery {
  address1?: string;
  city: string;
  /** USPS state code - omit for non-US addresses. */
  state?: string;
  /** ISO 3166-1 alpha-2 country code. */
  countryCode: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
}

/**
 * Resolves an address (or, failing that, just a city/state/country) to an
 * approximate lat/lng via OpenStreetMap's free, keyless Nominatim service -
 * defensive (never throws, resolves to undefined on any failure/timeout).
 * Used by GroupWizardDialogComponent so in-person groups can participate in
 * distance search even when the address itself is never displayed.
 *
 * PII note (reviewed in the 2026-08 security sweep, accepted as-is): when a
 * group leader enters a street address (including for a group flagged
 * private/address-hidden - "never displayed" above means never displayed to
 * *other members*, not withheld from this lookup), that address is sent to
 * Nominatim, a third party. This is inherent to using a free geocoding
 * service for group meeting locations, not a coding bug - Nominatim's usage
 * policy prohibits systematic/bulk querying but doesn't retain a lookup
 * history tied back to this app. If this needs tightening further, the fix
 * is either a paid geocoder with a stricter data-processing agreement, or
 * dropping street-level precision for private groups (city/state only) - not
 * attempted here since it's a product tradeoff (search precision vs. this
 * exposure), not something to change unilaterally in code.
 */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  async geocode(query: GeocodeQuery): Promise<GeocodeResult | undefined> {
    const params = new URLSearchParams({
      format: 'jsonv2',
      limit: '1',
      city: query.city,
      countrycodes: query.countryCode.toLowerCase(),
    });
    if (query.address1) {
      params.set('street', query.address1);
    }
    if (query.state) {
      params.set('state', query.state);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
    try {
      const response = await fetch(`${LOOKUP_URL}?${params.toString()}`, { signal: controller.signal });
      if (!response.ok) {
        return undefined;
      }
      const results = (await response.json()) as Array<{ lat?: string; lon?: string }>;
      const first = results[0];
      if (!first?.lat || !first.lon) {
        return undefined;
      }
      const lat = Number(first.lat);
      const lng = Number(first.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return undefined;
      }
      return { lat, lng };
    } catch {
      // Offline, blocked, aborted (timeout), or an unparsable response -
      // this is a best-effort lookup; a failed geocode just means the
      // group won't participate in radius search, never a blocked create.
      return undefined;
    } finally {
      clearTimeout(timeout);
    }
  }
}
