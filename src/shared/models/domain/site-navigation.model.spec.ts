import {
  liveNavItems,
  MAX_NAV_DEPTH,
  navItemHref,
  SiteNavItem,
  validateSiteNavigation
} from './site-navigation.model';
import { CUTOVER_SLUGS, RESERVED_SLUGS, SITE_ROUTES, isSlugAvailable, siteRoute, siteRoutePath } from '../../lists/site_routes';

// The rules a menu has to keep, pinned here rather than in the admin screen
// because the SEED SCRIPT and the editor both have to agree about them - a
// seed that writes something the editor would refuse is how a screen ends up
// unable to save the data it was opened on.

const item = (over: Partial<SiteNavItem> = {}): SiteNavItem => ({
  id: 'i1', title: 'Seminars', kind: 'page', routeKey: 'seminars', visible: true, ...over
});

describe('site route catalogue', () => {
  it('has a unique key per route - the key is what a menu item stores', () => {
    const keys = SITE_ROUTES.map((route) => route.key);
    expect(new Set(keys).size).withContext(`duplicate keys in ${keys}`).toBe(keys.length);
  });

  it('has a unique path per route, so two keys cannot mean the same page', () => {
    const paths = SITE_ROUTES.map((route) => route.path);
    const dupes = paths.filter((path, i) => paths.indexOf(path) !== i);
    expect(dupes).withContext(`duplicate paths: ${dupes}`).toEqual([]);
  });

  it('gives every route a label and a site-relative path', () => {
    for (const route of SITE_ROUTES) {
      expect(route.label?.trim()).withContext(`${route.key} has no label`).toBeTruthy();
      expect(route.path.startsWith('/'))
        .withContext(`${route.key} path "${route.path}" is not site-relative`).toBeTrue();
    }
  });

  it('carries no query strings - those are custom links, not catalogue routes', () => {
    // '/store?category=spanish-resources' is a real menu entry today and is
    // deliberately NOT a catalogue route: the catalogue names pages, and a
    // filtered view of one is an address.
    for (const route of SITE_ROUTES) {
      expect(route.path).withContext(`${route.key} carries a query`).not.toContain('?');
    }
  });

  it('resolves a known key and refuses an unknown one', () => {
    expect(siteRoutePath('give')).toBe('/give');
    expect(siteRoute('give')?.label).toBe('Give');
    // Undefined rather than a guess: a stale key must surface as a problem,
    // not as a link to somewhere plausible.
    expect(siteRoutePath('give-2')).toBeUndefined();
  });

  it('covers every destination the current menu points at, or leaves it to a custom link', () => {
    // The seed has to be able to express today's menu. Anything not here has
    // to be expressible as a typed address instead - these four are.
    // Widened to string[] deliberately: SITE_ROUTES is `as const`, so the
    // mapped array is a union of path LITERALS and toContain() would then
    // only accept a path that already exists - which is the one thing this
    // test must not require.
    const paths: string[] = SITE_ROUTES.map((route) => route.path);
    for (const needed of ['/', '/seminars', '/equipping-groups', '/impact-groups',
      '/coaching-with-impact', '/lunch-and-learns', '/events', '/e-books', '/podcasts',
      '/disciple-making-minute', '/monthly-newsletter', '/store', '/give', '/team',
      '/summit/2027']) {
      expect(paths).withContext(`${needed} is in the menu but not the catalogue`).toContain(needed);
    }
  });
});

describe('slugs a staff-created page may use', () => {
  // A page created as 'store' saves cleanly, appears in the nav, and opens
  // the shop - because the store's matcher runs before the dynamic-page one.
  // Nothing reports it, which is why the refusal is here rather than left to
  // whoever is typing.

  it('refuses a segment the web app already routes', () => {
    expect(isSlugAvailable('store')).toBeFalse();
    expect(isSlugAvailable('give')).toBeFalse();
    expect(isSlugAvailable('checkout')).toBeFalse();
  });

  it('refuses it whatever case or padding it arrives in', () => {
    expect(isSlugAvailable('  STORE  ')).toBeFalse();
  });

  it('allows an ordinary new page', () => {
    expect(isSlugAvailable('mens-retreat')).toBeTrue();
    expect(isSlugAvailable('summit-2028-recap')).toBeTrue();
  });

  it('refuses anything that is not ONE plain path segment', () => {
    // The matcher only ever sees a single segment, so a slug containing a
    // slash would route to nothing while looking perfectly reasonable in a
    // text box.
    expect(isSlugAvailable('mens/retreat')).toBeFalse();
    expect(isSlugAvailable('mens retreat')).toBeFalse();
    expect(isSlugAvailable('retreat?year=2028')).toBeFalse();
    expect(isSlugAvailable('-leading-hyphen')).toBeFalse();
    expect(isSlugAvailable('trailing-hyphen-')).toBeFalse();
    expect(isSlugAvailable('')).toBeFalse();
  });

  it('reserves every path the linkable catalogue names', () => {
    // SITE_ROUTES is what the Navigation picker offers. If one of those
    // destinations were NOT reserved, a staff page could be created on top
    // of a route the menu already points at.
    const unreserved = SITE_ROUTES
      .map((route) => route.path.split('/').filter(Boolean)[0])
      .filter((segment): segment is string => !!segment)
      // A CUT-OVER page's segment is unreserved BY DESIGN - the dynamic
      // route serves it, and the migrated page itself blocks the name in
      // the New Page dialog's duplicate check.
      .filter((segment) => !CUTOVER_SLUGS.includes(segment))
      .filter((segment) => !RESERVED_SLUGS.includes(segment));

    expect(unreserved).toEqual([]);
  });
});

describe('validating a menu', () => {
  it('accepts a menu shaped like the real one', () => {
    expect(validateSiteNavigation([
      item({ id: 'a', title: 'Home', routeKey: 'home' }),
      item({
        id: 'b', title: 'Training', kind: 'group', routeKey: undefined,
        children: [item({ id: 'b1' }), item({ id: 'b2', routeKey: 'lunch-and-learns' })]
      }),
      item({
        id: 'c', title: 'Impact Golf Tournament', kind: 'custom', routeKey: undefined,
        url: 'https://events.golfstatus.com/event/2nd-Annual-Impact-Golf-Tournament',
        external: true, highlight: true
      })
    ])).toEqual([]);
  });

  it('catches a repeated id, which would make a rename edit two rows', () => {
    const problems = validateSiteNavigation([item({ id: 'same' }), item({ id: 'same', title: 'Give' })]);
    expect(problems.length).toBe(1);
    expect(problems[0]).toContain('repeats an id');
  });

  it('catches a page item that names no route', () => {
    expect(validateSiteNavigation([item({ routeKey: undefined })])[0]).toContain('names no route');
  });

  it('catches a link with no address', () => {
    expect(validateSiteNavigation([item({ kind: 'custom', routeKey: undefined })])[0])
      .toContain('has no address');
  });

  it('catches an empty dropdown, which renders as a dead click', () => {
    expect(validateSiteNavigation([item({ kind: 'group', routeKey: undefined })])[0])
      .toContain('nothing in it');
  });

  it('catches children hung off something that is not a dropdown', () => {
    expect(validateSiteNavigation([item({ children: [item({ id: 'x' })] })])[0])
      .toContain('not a dropdown');
  });

  it(`catches a third level, which nothing on the site draws`, () => {
    const problems = validateSiteNavigation([
      item({
        id: 'a', kind: 'group', routeKey: undefined, title: 'Training',
        children: [item({
          id: 'b', kind: 'group', routeKey: undefined, title: 'Deeper',
          children: [item({ id: 'c', title: 'Buried' })]
        })]
      })
    ]);
    expect(problems.join(' ')).toContain(`draws ${MAX_NAV_DEPTH} levels`);
  });

  it('names the item, by its path through the menu, so a problem can be found', () => {
    const problems = validateSiteNavigation([
      item({
        id: 'a', kind: 'group', routeKey: undefined, title: 'Resources',
        children: [item({ id: 'b', title: 'Podcasts', kind: 'custom', routeKey: undefined })]
      })
    ]);
    expect(problems[0]).toContain('Resources > Podcasts');
  });
});

describe('where a click goes', () => {
  const path = (key: string) => siteRoutePath(key) ?? '';

  it('sends a page item to its catalogue route, not to a stored URL', () => {
    expect(navItemHref(item({ routeKey: 'give' }), path)).toBe('/give');
  });

  it('sends a custom item to its typed address', () => {
    expect(navItemHref(item({ kind: 'custom', routeKey: undefined, url: '/store?category=spanish-resources' }), path))
      .toBe('/store?category=spanish-resources');
  });

  it('gives a dropdown label nowhere to go', () => {
    expect(navItemHref(item({ kind: 'group', routeKey: undefined, children: [item()] }), path))
      .toBeUndefined();
  });
});

describe('what a visitor actually sees', () => {
  it('drops a switched-off item', () => {
    const live = liveNavItems([item({ id: 'a' }), item({ id: 'b', title: 'Give', visible: false })]);
    expect(live.map((entry) => entry.title)).toEqual(['Seminars']);
  });

  it('drops a switched-off child but keeps its parent', () => {
    const live = liveNavItems([item({
      id: 'a', kind: 'group', routeKey: undefined, title: 'Training',
      children: [item({ id: 'b' }), item({ id: 'c', title: 'Hidden', visible: false })]
    })]);
    expect(live[0].children?.map((child) => child.title)).toEqual(['Seminars']);
  });

  it('drops a dropdown whose every child is switched off', () => {
    // Otherwise the header shows a menu that opens onto nothing.
    const live = liveNavItems([item({
      id: 'a', kind: 'group', routeKey: undefined, title: 'Training',
      children: [item({ id: 'b', visible: false })]
    })]);
    expect(live).toEqual([]);
  });

  it('leaves the stored menu untouched, so the editor keeps showing what is off', () => {
    const stored = [item({ id: 'a', visible: false })];
    liveNavItems(stored);
    expect(stored[0].visible).toBeFalse();
    expect(stored.length).toBe(1);
  });
});
