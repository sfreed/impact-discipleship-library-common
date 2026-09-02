/**
 * WHOSE DATA THIS IS.
 *
 * Everything the ministry owns lives under one document - `tenants/{id}` -
 * with a subcollection per kind, rather than as dozens of top-level
 * collections. Infrastructure that describes the SYSTEM rather than the
 * ministry stays where it is: error logs written before anyone is
 * authenticated, test-run records, schema markers.
 *
 * TWO REASONS, and the second is the one that actually earns it.
 *
 * 1. It reads as one thing. `tenants/impactdisciples.com` and everything the
 *    ministry owns is under it, in the console and in the rules.
 *
 * 2. IT MAKES A WHOLE CLASS OF MISTAKE IMPOSSIBLE. `scripts/promote.js`
 *    scopes a dev->prod promotion to the collections that already exist in
 *    PROD - deliberately, so half-built dev-only collections do not leak
 *    across. The cost of that choice is that a genuinely new collection is
 *    never promoted unless somebody remembers `--only`. That is exactly how
 *    production ended up with no `page_content`, no `site_navigation` and no
 *    `site_footer` while the admin happily edited all three: nothing was
 *    broken, nobody forgot a step, the tool simply could not see them.
 *
 *    Under one parent, `tenants` is in prod's own schema from the first
 *    promotion onwards, so every future collection rides along as a
 *    subcollection of something already in scope. The list stops being
 *    something a human maintains.
 *
 * IT WAS CALLED `sites` UNTIL 2026-09-02, which was right while the only
 * thing under it was a website. Renamed once the goal became everything the
 * ministry owns, because a document id can never be renamed and a collection
 * can only be renamed by copying it: 82 documents then, 15,749 after the rest
 * of the migration. The timing was the whole argument.
 *
 * WHAT THIS IS NOT, yet. This is a data shape, not multi-tenancy. There is
 * one tenant and the id is a constant. Hosting still serves one domain, admin
 * permissions are still global, and Storage partitions by prefix rather than
 * by anything enforced - see `SITE_HOSTNAMES` below for the one piece
 * deliberately left ready.
 */

/**
 * The one tenant, today.
 *
 * READS AS THE DOMAIN, AND IS NOT THE DOMAIN. A document id can never be
 * renamed - correcting one means copying the whole tree across two projects
 * - so it must not carry anything that changes. Domains change: a rebrand, a
 * second TLD, an apex-vs-www decision.
 *
 * It is the domain's *shape* for legibility in the console, and
 * `SITE_HOSTNAMES` below is what any lookup should actually match on. Same
 * rule the nav already follows: store the key, resolve the address.
 */
export const TENANT_ID = 'impactdisciples.com';

/**
 * Every hostname that serves this tenant's public site - apex, www, and the
 * dev host.
 *
 * THE FIELD A HOSTNAME LOOKUP MUST USE, when there is ever more than one
 * tenant. One site legitimately answers to several names, and the dev host is
 * not the domain at all, so `tenants/{location.hostname}` would resolve in
 * production-on-www and miss on the apex and miss in dev entirely. Stored on
 * the tenant document; this is the seed value.
 *
 * Still named for the SITE rather than the tenant on purpose: a tenant is not
 * a website and does not have hostnames. Its site does.
 */
export const SITE_HOSTNAMES: readonly string[] = [
  'impactdisciples.com',
  'www.impactdisciples.com',
  'impactdisciplesdev-public.web.app'
];

/**
 * The collections that belong to the TENANT and therefore move underneath it.
 *
 * ANYTHING NOT LISTED HERE IS UNTOUCHED. tenantPath() returns it unchanged,
 * so adding a name here is the whole of "move that collection", and leaving
 * one out cannot silently half-migrate it.
 *
 * TWO KINDS OF NAME MUST NEVER APPEAR IN THIS LIST, and both fail silently:
 *
 * - Anything a Firebase Extension watches. `mail` is owned by
 *   `firestore-send-email`, whose watch path is configured in Firebase rather
 *   than in this repository. Moving it stops email with no code change to
 *   blame for it.
 * - Anything written before a caller is authenticated - `errorLogs` - whose
 *   rules exception is keyed to the top-level path.
 */
export const TENANT_COLLECTIONS: readonly string[] = [
  // Wave 0 - what the public site renders and Page Manager edits.
  'page_content',
  'site_navigation',
  'site_footer',
  'dock_bar',
  'config',
  'testimonials',
  'impact_team',
  'dmms',
  'faq',

  // Wave 1 - reference data. No Firestore trigger watches any of these, so
  // every way of getting one wrong fails LOUDLY: a read returns nothing and
  // a screen is visibly empty. That is the whole reason this wave goes
  // first - if the tooling is wrong, it is wrong here, where a mistake costs
  // a re-run rather than a silently unfulfilled order.
  'commonTranslations',
  'titleTranslations',
  'coaches',
  'organizations',
  'locations',
  'product_categories',
  'series',
  'product_tags',
  'forms',
  'bulkDiscountTiers',
  'subtemplates',
  'popup_templates',
  'appConfig',
  'lessonTemplates'
];

/**
 * Where a collection actually lives.
 *
 * The single seam every read and write goes through - both apps' FirebaseDAO
 * and the Cloud Functions that touch tenant data. One function, so "where
 * does this live" has exactly one answer and a future change of mind is one
 * edit rather than a search across three codebases.
 *
 * @param table The collection name a service asks for.
 * @return Its real path: nested for a tenant collection, unchanged otherwise.
 */
export function tenantPath(table: string): string {
  return TENANT_COLLECTIONS.includes(table)
    ? `tenants/${TENANT_ID}/${table}`
    : table;
}

/**
 * The document pattern a Firestore TRIGGER watches.
 *
 * THE ONE PLACE IN THE SYSTEM WHERE A WRONG PATH IS SILENT. Every other
 * consumer of the seam fails loudly - a read returns nothing and a screen is
 * visibly empty within a minute. A trigger whose pattern stops matching
 * simply never runs: Firestore raises nothing, the deploy succeeds, and the
 * logs are empty because no code executed. A purchase then looks completely
 * normal and is never fulfilled, never upserted onto a customer, and never
 * grants the library licence somebody paid for.
 *
 * Before this existed the pattern was a hardcoded literal in each trigger,
 * so moving a collection meant remembering to edit them by hand - fourteen
 * of them, across eleven files, with no error if you missed one. Going
 * through here means a collection joins TENANT_COLLECTIONS and its triggers
 * follow, in the same edit, by construction.
 *
 * `integration/trigger-liveness.test.js` is the belt to this braces: it
 * writes through the same seam and asserts the side effect actually
 * happened, so a trigger that stops firing for any OTHER reason still goes
 * red.
 *
 * @param table The collection the trigger watches.
 * @param rest The wildcard remainder, e.g. `{id}` or `{groupId}/members/{email}`.
 * @return The full document pattern.
 */
export function triggerPath(table: string, rest: string): string {
  return `${tenantPath(table)}/${rest}`;
}
