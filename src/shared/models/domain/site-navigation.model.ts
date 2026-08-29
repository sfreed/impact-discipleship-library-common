import { SiteRouteKey } from '../../lists/site_routes';

/**
 * THE PUBLIC SITE'S TOP NAVIGATION (2026-08-29).
 *
 * One configuration, rendered by BOTH the desktop header and the mobile
 * off-canvas menu. That is the whole point of it existing: until now the web
 * repo carried two hand-maintained arrays in `nav-menu-data.ts`, and they had
 * silently drifted - the mobile Store had no dropdown, so Impact Merchandise
 * could not be reached from a phone at all, and Impact Golf Tournament was
 * missing from mobile entirely. Nothing asserted either list, so the only way
 * to discover a hole was for a visitor to fall into it.
 *
 * There is deliberately NO per-device visibility. An item is in the menu or
 * it is not. "Desktop only" would recreate exactly the divergence this
 * replaces, so if it is ever genuinely wanted it should arrive as a named,
 * deliberate flag rather than as two lists again.
 *
 * NOTHING STORES A POSITION. Order is array order, top level and children
 * alike - same rule as PageContentBlock. A stored `order` field is a second
 * source of truth that disagrees with the array the moment anything is
 * inserted.
 */

/** What a menu item actually is. The three are mutually exclusive. */
export type SiteNavKind =
  /** Points at a known route on the public site - see SITE_ROUTES. The
   *  editor offers these from a catalogue, so a page item cannot point
   *  somewhere that does not exist. */
  | 'page'
  /** A typed address: an off-site link (Impact Merchandise, the golf
   *  tournament) or an internal one the catalogue does not cover, such as a
   *  route carrying a query string. */
  | 'custom'
  /** A dropdown label with children and no destination of its own -
   *  "Training", "Resources". Clicking it opens the dropdown. */
  | 'group';

export interface SiteNavItem {
  /** Stable across reorders and renames, so a rename is not a delete plus an
   *  add. Generated once when the item is created. */
  id: string;

  /** What a visitor reads. Seeded from the catalogue's own label for a page
   *  item, then editable - the menu says "Donate" where the route is
   *  `/give`, and "Upcoming Training" where it is `/events`. */
  title: string;

  kind: SiteNavKind;

  /** kind === 'page' only. The catalogue key, NOT the URL - so a route that
   *  moves is corrected in one place instead of everywhere it is linked. */
  routeKey?: SiteRouteKey;

  /** kind === 'custom' only. A full URL for an off-site link, or a
   *  site-relative path for an internal one. */
  url?: string;

  /** kind === 'custom' only, and meaningful only when the url leaves the
   *  site: open in a new tab. A page item is never external by definition.
   */
  external?: boolean;

  /** Draws the item in the accent treatment - Summit 2027 and the golf
   *  tournament today. */
  highlight?: boolean;

  /** Switched off without being deleted, so a seasonal item (a summit, a
   *  tournament) can come back next year with its title and link intact. */
  visible: boolean;

  /** kind === 'group' only. ONE level deep - the public header renders a
   *  single dropdown and nothing renders a third rank, so a grandchild would
   *  be stored and never drawn. MAX_NAV_DEPTH is the constant that says so.
   */
  children?: SiteNavItem[];
}

export interface SiteNavigation {
  /** Always 'main' - there is one menu. A collection with one document
   *  rather than a field on web_config so the whole menu is one atomic
   *  write: a reorder that half-applied would be a scrambled site header.
   */
  id?: string;
  items: SiteNavItem[];
}

/** The public header renders a top level and one dropdown. Nothing renders a
 *  third rank on either desktop or mobile. */
export const MAX_NAV_DEPTH = 2;

/** Where the single navigation document lives. */
export const SITE_NAVIGATION_COLLECTION = 'site_navigation';
export const SITE_NAVIGATION_DOC_ID = 'main';

/**
 * Everything wrong with a menu, as plain sentences.
 *
 * Exported rather than inlined into the admin screen because the SEED SCRIPT
 * and the admin editor have to agree about what a valid menu is - a seed that
 * writes something the editor would refuse is how a screen ends up unable to
 * save the data it was opened on.
 */
export function validateSiteNavigation(items: SiteNavItem[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  const check = (item: SiteNavItem, depth: number, path: string): void => {
    const where = path ? `${path} > ${item.title}` : item.title;

    if (!item.title?.trim()) {
      problems.push(`An item under "${path || 'the top level'}" has no title.`);
    }
    if (!item.id?.trim()) {
      problems.push(`"${where}" has no id.`);
    } else if (seen.has(item.id)) {
      problems.push(`"${where}" repeats an id already used - ids must be unique.`);
    } else {
      seen.add(item.id);
    }

    if (item.kind === 'page' && !item.routeKey) {
      problems.push(`"${where}" is a page but names no route.`);
    }
    if (item.kind === 'custom' && !item.url?.trim()) {
      problems.push(`"${where}" is a link but has no address.`);
    }
    if (item.kind === 'group' && !item.children?.length) {
      problems.push(`"${where}" is a dropdown with nothing in it.`);
    }
    if (item.kind !== 'group' && item.children?.length) {
      problems.push(`"${where}" has items under it but is not a dropdown.`);
    }
    if (item.children?.length && depth >= MAX_NAV_DEPTH) {
      problems.push(`"${where}" is nested too deep - the site draws ${MAX_NAV_DEPTH} levels.`);
    }

    for (const child of item.children ?? []) {
      check(child, depth + 1, where);
    }
  };

  for (const item of items) {
    check(item, 1, '');
  }

  return problems;
}

/** The destination a visitor's click actually goes to. One place, so the
 *  header, the mobile menu and the admin preview cannot disagree. */
export function navItemHref(item: SiteNavItem, routePath: (key: SiteRouteKey) => string): string | undefined {
  if (item.kind === 'group') {
    return undefined; // a label, not a link
  }
  return item.kind === 'page' && item.routeKey ? routePath(item.routeKey) : item.url;
}

/** Items a VISITOR should see - switched-off items, and any dropdown left
 *  with nothing visible under it, drop out. Applied by the site, never by the
 *  editor, which has to keep showing what is switched off in order to switch
 *  it back on. */
export function liveNavItems(items: SiteNavItem[]): SiteNavItem[] {
  return items
    .filter((item) => item.visible)
    .map((item) => ({ ...item, children: (item.children ?? []).filter((child) => child.visible) }))
    .filter((item) => item.kind !== 'group' || (item.children?.length ?? 0) > 0);
}
