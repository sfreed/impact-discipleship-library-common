import {
  SITE_HOSTNAMES,
  TENANT_COLLECTIONS,
  TENANT_ID,
  tenantPath
} from './tenancy';

// THE SEAM EVERY TENANT READ AND WRITE GOES THROUGH. Both apps' FirebaseDAO
// and the Cloud Functions that touch tenant data resolve their path here,
// so a mistake in this file is a mistake on every page of the public site at
// once - and the failure mode is silent: a wrong path reads an empty
// collection rather than throwing.

describe('tenantPath', () => {
  it('nests a tenant collection under the tenant document', () => {
    expect(tenantPath('page_content')).toBe(`tenants/${TENANT_ID}/page_content`);
    expect(tenantPath('site_navigation')).toBe(`tenants/${TENANT_ID}/site_navigation`);
  });

  it('leaves everything else exactly as it was', () => {
    // The narrowness of the move IS the safety. A stray rename here would
    // point a live screen at a collection that does not exist.
    for (const untouched of ['customers', 'purchases', 'events', 'admin_users',
      'campaigns', 'forms', 'products', 'libraryUsers', 'errorLogs']) {
      expect(tenantPath(untouched))
        .withContext(`${untouched} must not move`)
        .toBe(untouched);
    }
  });

  it('never moves a collection owned by something outside this repo', () => {
    // `mail` is watched by the firestore-send-email extension, whose path is
    // configured in Firebase rather than here. Nesting it stops email with no
    // code change to blame - so it is pinned rather than left to a comment.
    // `errorLogs` is written pre-auth against a top-level rules exception.
    expect(tenantPath('mail')).toBe('mail');
    expect(tenantPath('errorLogs')).toBe('errorLogs');
    expect(TENANT_COLLECTIONS).not.toContain('mail');
    expect(TENANT_COLLECTIONS).not.toContain('errorLogs');
  });

  it('nests every collection it claims to, and only those', () => {
    // Both directions, so the list and the behaviour cannot drift.
    for (const name of TENANT_COLLECTIONS) {
      expect(tenantPath(name)).toBe(`tenants/${TENANT_ID}/${name}`);
    }
    expect(TENANT_COLLECTIONS.filter((n) => tenantPath(n) === n)).toEqual([]);
  });

  it('is idempotent in the only sense that matters - it never double-nests', () => {
    // A path is resolved once, at the DAO. If a caller ever passes an
    // already-resolved path back in, the result must not become
    // tenants/x/tenants/x/page_content - which would read empty, silently.
    const once = tenantPath('page_content');
    expect(tenantPath(once)).toBe(once);
  });

  it('does not resolve under the OLD root', () => {
    // The rename is only finished when nothing answers on `sites/` any more.
    // Pinned because both roots deliberately co-existed during the cutover,
    // and a half-reverted constant would read the stale copy in silence.
    for (const name of TENANT_COLLECTIONS) {
      expect(tenantPath(name)).not.toContain('sites/');
    }
  });
});

describe('the tenant identity', () => {
  it('reads as the domain but is not used as one', () => {
    // The id must not be looked up by hostname - see SITE_HOSTNAMES. This
    // pins the shape so a future reader knows the resemblance is deliberate
    // and cosmetic.
    expect(TENANT_ID).toBe('impactdisciples.com');
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
