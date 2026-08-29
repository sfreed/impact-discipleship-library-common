/**
 * THE PUBLIC SITE'S LINKABLE DESTINATIONS (2026-08-29).
 *
 * What the admin's Navigation screen offers when you pick a page to put in
 * the menu, and what a `kind: 'page'` menu item names instead of a raw URL -
 * so a route that moves is corrected HERE, once, rather than in every place
 * it happens to be linked.
 *
 * WHY THIS IS HAND-MAINTAINED, AND THE CHECK THAT KEEPS IT HONEST.
 * The admin cannot read the web app's router at runtime - they are separate
 * builds - so this list is declared. A declared list of another app's routes
 * rots the moment somebody renames a route, and it rots SILENTLY: the picker
 * carries on offering a destination that 404s. The web repo therefore owns a
 * spec that resolves every `path` below against its real router config and
 * fails if one no longer exists. That spec is the whole reason this file is
 * safe to keep by hand - without it this is a list of hopeful strings.
 *
 * `page_content` is NOT this list. It holds the twelve pages whose CONTENT is
 * editable; the menu also points at ten routes that are not editable pages at
 * all - the store, the podcast index, the events list, a summit. A menu item
 * only needs somewhere to go.
 *
 * Anything not listed here is still reachable as a `kind: 'custom'` item with
 * a typed address, which is how the two off-site links and the one route
 * carrying a query string are handled.
 */

export interface SiteRoute {
  /** Stored on the menu item. Never renamed once in use - a stored item
   *  naming a key that no longer exists is an item pointing nowhere. */
  key: string;
  /** The path as the web app routes it. Kept in sync by the web repo's own
   *  spec (see this file's header). */
  path: string;
  /** What the picker calls it. NOT what the menu says - the menu carries its
   *  own editable title, which is why "/give" can be labelled "Donate". */
  label: string;
  /** Groups the picker so twenty-odd destinations are scannable. */
  group: 'Main' | 'Training' | 'Resources' | 'Store' | 'Events' | 'About';
  /** True where the page's own CONTENT is editable under Page Manager. The
   *  picker says so, because "this page is in the menu but nobody can edit
   *  it" and "this page is editable but is not in the menu" are both things
   *  worth seeing while arranging a menu. */
  editable?: boolean;
}

// `as const satisfies` rather than `: SiteRoute[]`, so SiteRouteKey below is
// the union of the actual keys instead of widening to plain `string`. That
// turns a typo in a stored routeKey into a compile error at every admin and
// web call site, while `satisfies` still type-checks every entry against
// SiteRoute. (Runtime validation is still needed - a key can go stale in
// Firestore after a catalogue edit, which the compiler cannot see.)
export const SITE_ROUTES = [
  { key: 'home', path: '/', label: 'Home', group: 'Main', editable: true },
  { key: 'about-us', path: '/about-us', label: 'About Us', group: 'About', editable: true },
  { key: 'team', path: '/team', label: 'Team', group: 'About', editable: true },
  { key: 'contact', path: '/contact', label: 'Contact', group: 'About', editable: true },
  { key: 'give', path: '/give', label: 'Give', group: 'Main', editable: true },
  { key: 'prayer-team', path: '/prayer-team', label: 'Prayer Team', group: 'About', editable: true },

  { key: 'seminars', path: '/seminars', label: 'Seminars', group: 'Training', editable: true },
  { key: 'equipping-groups', path: '/equipping-groups', label: 'Equipping Groups', group: 'Training', editable: true },
  { key: 'equipping-pastors', path: '/equipping-groups-pastors', label: 'Equipping - Pastors', group: 'Training', editable: true },
  { key: 'equipping-leaders', path: '/equipping-groups-leaders', label: 'Equipping - Leaders', group: 'Training', editable: true },
  { key: 'equipping-churches', path: '/equipping-groups-churches', label: 'Equipping - Churches', group: 'Training', editable: true },
  { key: 'coaching-with-impact', path: '/coaching-with-impact', label: 'Coaching with Impact', group: 'Training', editable: true },
  { key: 'lunch-and-learns', path: '/lunch-and-learns', label: 'Lunch and Learns', group: 'Training', editable: true },
  { key: 'impact-groups', path: '/impact-groups', label: 'Find an Impact Group', group: 'Training' },

  { key: 'discipleship-library', path: '/discipleship-library', label: 'Discipleship Library', group: 'Resources', editable: true },
  { key: 'e-books', path: '/e-books', label: 'E-Books', group: 'Resources' },
  { key: 'podcasts', path: '/podcasts', label: 'Podcasts', group: 'Resources' },
  { key: 'disciple-making-minute', path: '/disciple-making-minute', label: 'Disciple-Making Minute', group: 'Resources' },
  { key: 'monthly-newsletter', path: '/monthly-newsletter', label: 'Monthly Newsletter', group: 'Resources' },

  { key: 'store', path: '/store', label: 'Store', group: 'Store' },

  { key: 'events', path: '/events', label: 'Upcoming Events', group: 'Events' },
  { key: 'summit-2027', path: '/summit/2027', label: 'Summit 2027', group: 'Events' }
] as const satisfies readonly SiteRoute[];

export type SiteRouteKey = (typeof SITE_ROUTES)[number]['key'];

const BY_KEY: Map<string, SiteRoute> = new Map(
  SITE_ROUTES.map((route): [string, SiteRoute] => [route.key, route])
);

export function siteRoute(key: string): SiteRoute | undefined {
  return BY_KEY.get(key);
}

/** The path a `kind: 'page'` menu item resolves to. Returns undefined rather
 *  than a guess when the key is unknown, so a stale key renders as a
 *  reportable problem instead of a link to nowhere. */
export function siteRoutePath(key: string): string | undefined {
  return BY_KEY.get(key)?.path;
}

/** Catalogue order, grouped, for the picker. */
export const SITE_ROUTE_GROUPS: SiteRoute['group'][] =
  ['Main', 'Training', 'Resources', 'Store', 'Events', 'About'];
