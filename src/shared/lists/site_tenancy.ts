/**
 * WHICH SITE'S DATA THIS IS.
 *
 * The public site's own content lives under one document - `sites/{siteId}`
 * - with a subcollection per kind, rather than as nine top-level
 * collections. Business data (customers, purchases, events, campaigns) and
 * platform data (admin users, logs, the library) stay where they are: they
 * belong to the ministry, not to a website.
 *
 * TWO REASONS, and the second is the one that actually earns it.
 *
 * 1. It reads as one thing. `sites/impactdisciples.com` and everything a
 *    site owns is under it, in the console and in the rules.
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
 *    Under one parent, `sites` is in prod's own schema from the first
 *    promotion onwards, so every future site collection rides along as a
 *    subcollection of something already in scope. The list stops being
 *    something a human maintains.
 *
 * WHAT THIS IS NOT, yet. This is a data shape, not multi-tenancy. There is
 * one site and the id is a constant. Hosting still serves one domain, admin
 * permissions are still global, and Storage is not partitioned at all. Those
 * are the expensive parts and none of them are done - see `hostnames` below
 * for the one piece deliberately left ready.
 */

/**
 * The one site, today.
 *
 * READS AS THE DOMAIN, AND IS NOT THE DOMAIN. A document id can never be
 * renamed - correcting one means copying the whole tree across two projects
 * - so it must not carry anything that changes. Domains change: a rebrand, a
 * second TLD, an apex-vs-www decision.
 *
 * It is the domain's *shape* for legibility in the console, and `hostnames`
 * below is what any lookup should actually match on. Same rule the nav
 * already follows: store the key, resolve the address.
 */
export const SITE_ID = 'impactdisciples.com';

/**
 * Every hostname that serves this site - apex, www, and the dev host.
 *
 * THE FIELD A HOSTNAME LOOKUP MUST USE, when there is ever more than one
 * site. One site legitimately answers to several names, and the dev host is
 * not the domain at all, so `sites/{location.hostname}` would resolve in
 * production-on-www and miss on the apex and miss in dev entirely. Stored on
 * the site document; this is the seed value.
 */
export const SITE_HOSTNAMES: readonly string[] = [
  'impactdisciples.com',
  'www.impactdisciples.com',
  'impactdisciplesdev-public.web.app'
];

/**
 * The collections that belong to a SITE and therefore move underneath it.
 *
 * The boundary is "what the public site renders and Page Manager edits". It
 * is deliberately narrow: `forms`, `campaign_popups` and `popup_templates`
 * are shared with business flows, and everything else - customers, orders,
 * events, the library - belongs to the ministry rather than to a website.
 *
 * ANYTHING NOT LISTED HERE IS UNTOUCHED. tenantPath() returns it unchanged,
 * so adding a name here is the whole of "move that collection", and leaving
 * one out cannot silently half-migrate it.
 */
export const SITE_COLLECTIONS: readonly string[] = [
  'page_content',
  'site_navigation',
  'site_footer',
  'dock_bar',
  'config',
  'testimonials',
  'impact_team',
  'dmms',
  'faq'
];

/**
 * Where a collection actually lives.
 *
 * The single seam every read and write goes through - both apps' FirebaseDAO
 * and the handful of Cloud Functions that touch site content. One function,
 * so "where does this live" has exactly one answer and a future change of
 * mind is one edit rather than a search across three codebases.
 *
 * @param table The collection name a service asks for.
 * @return Its real path: nested for a site collection, unchanged otherwise.
 */
export function tenantPath(table: string): string {
  return SITE_COLLECTIONS.includes(table)
    ? `sites/${SITE_ID}/${table}`
    : table;
}
