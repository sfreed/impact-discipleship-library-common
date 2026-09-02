import {
  SITE_COLLECTIONS,
  SITE_HOSTNAMES,
  SITE_ID,
  tenantPath
} from './site_tenancy';

// THE SEAM EVERY SITE READ AND WRITE GOES THROUGH. Both apps' FirebaseDAO
// and the Cloud Functions that touch site content resolve their path here,
// so a mistake in this file is a mistake on every page of the public site at
// once - and the failure mode is silent: a wrong path reads an empty
// collection rather than throwing.

describe('tenantPath', () => {
  it('nests a site collection under the site document', () => {
    expect(tenantPath('page_content')).toBe(`sites/${SITE_ID}/page_content`);
    expect(tenantPath('site_navigation')).toBe(`sites/${SITE_ID}/site_navigation`);
  });

  it('leaves everything else exactly as it was', () => {
    // The narrowness of the move IS the safety. Business and platform data
    // belong to the ministry, not to a website, and a stray rename here
    // would point a live screen at a collection that does not exist.
    for (const untouched of ['customers', 'purchases', 'events', 'admin_users',
      'campaigns', 'forms', 'products', 'libraryUsers', 'errorLogs']) {
      expect(tenantPath(untouched))
        .withContext(`${untouched} must not move`)
        .toBe(untouched);
    }
  });

  it('nests every collection it claims to, and only those', () => {
    // Both directions, so the list and the behaviour cannot drift.
    for (const name of SITE_COLLECTIONS) {
      expect(tenantPath(name)).toBe(`sites/${SITE_ID}/${name}`);
    }
    expect(SITE_COLLECTIONS.filter((n) => tenantPath(n) === n)).toEqual([]);
  });

  it('is idempotent in the only sense that matters - it never double-nests', () => {
    // A path is resolved once, at the DAO. If a caller ever passes an
    // already-resolved path back in, the result must not become
    // sites/x/sites/x/page_content - which would read empty, silently.
    const once = tenantPath('page_content');
    expect(tenantPath(once)).toBe(once);
  });
});

describe('the site identity', () => {
  it('reads as the domain but is not used as one', () => {
    // The id must not be looked up by hostname - see SITE_HOSTNAMES. This
    // pins the shape so a future reader knows the resemblance is deliberate
    // and cosmetic.
    expect(SITE_ID).toBe('impactdisciples.com');
  });

  it('lists every hostname that serves this site, including dev', () => {
    // The reason the id is NOT the lookup key: one site answers to the
    // apex, to www, and in dev to a web.app address that is not the domain
    // at all. A lookup keyed on the id would miss two of the three.
    expect(SITE_HOSTNAMES).toContain('impactdisciples.com');
    expect(SITE_HOSTNAMES).toContain('www.impactdisciples.com');
    expect(SITE_HOSTNAMES)
      .withContext('the dev host must resolve too, or this is untestable in dev')
      .toContain('impactdisciplesdev-public.web.app');
  });

  it('has no duplicate hostnames', () => {
    expect(new Set(SITE_HOSTNAMES).size).toBe(SITE_HOSTNAMES.length);
  });
});
