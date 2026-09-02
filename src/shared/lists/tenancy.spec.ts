import {
  SITE_HOSTNAMES,
  TENANT_COLLECTIONS,
  TENANT_ID,
  tenantPath,
  triggerPath
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

  it('leaves the PERMANENTLY excluded collections exactly as they are', () => {
    // This list used to name whatever had not moved yet - customers,
    // products, events - which made it a to-do list rather than a rule, and
    // it went red the moment Wave 2 moved them. Correctly red, and useless:
    // a test that has to be edited every wave is telling you nothing on the
    // waves in between.
    //
    // These five are different. Each is excluded for a reason that will
    // never expire, so the assertion means the same thing forever.
    const permanentlyExcluded = [
      'mail',         // the firestore-send-email extension's watch path
      'errorLogs',    // written before a caller is authenticated
      'e2e_runs',     // a record of test runs, not of the ministry
      'meta',         // schema and counter markers
      'systemState'   // the system's own bookkeeping
    ];
    for (const untouched of permanentlyExcluded) {
      expect(tenantPath(untouched))
        .withContext(`${untouched} must NEVER move`)
        .toBe(untouched);
      expect(TENANT_COLLECTIONS)
        .withContext(`${untouched} must never enter the list`)
        .not.toContain(untouched);
    }
  });

  it('does not move a collection nobody has asked it to', () => {
    // A name absent from the list comes back untouched. This is what makes
    // "add a name to move a collection" safe: leaving one out cannot
    // half-migrate it, it simply does nothing.
    expect(tenantPath('some_collection_that_does_not_exist'))
      .toBe('some_collection_that_does_not_exist');
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

describe('triggerPath', () => {
  it('follows a collection when it moves, which is the entire point', () => {
    // A trigger pattern is the one path in the system whose mistakes are
    // silent - nothing errors, nothing logs, the function simply never runs.
    // Building it from the same list the DAO reads means a collection cannot
    // move without its triggers moving in the same edit.
    expect(triggerPath('page_content', '{id}'))
      .toBe(`tenants/${TENANT_ID}/page_content/{id}`);
  });

  it('leaves an unmoved collection where it is', () => {
    expect(triggerPath('purchases', '{id}')).toBe('purchases/{id}');
  });

  it('keeps deep wildcard remainders intact', () => {
    // discussionGroups' notification triggers watch subcollections, and the
    // remainder carries its own wildcards. Mangling it would break them in
    // exactly the silent way this helper exists to prevent.
    expect(triggerPath('discussionGroups', '{groupId}/members/{email}'))
      .toBe('discussionGroups/{groupId}/members/{email}');
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
