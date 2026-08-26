// The end-to-end test CATALOG: what each suite covers, in plain language.
//
// Authored knowledge, deliberately versioned beside the tests rather than
// derived from them. A spec file's name says what it is called; it does not
// say what breaks for a person when it goes red, which functional area that
// is, or which apps have to agree for it to pass. Those are the three things
// the Root-only E2E Dashboard in the admin app shows, and they only exist
// because someone wrote them down.
//
// Lives in the shared submodule so all three apps read ONE list - the same
// reasoning as contract/ and config/ beside it. The admin app renders it; the
// suites themselves are free to read it too.
//
// LAST-RUN STATUS IS NOT HERE. That is runtime data: each suite publishes to
// the `e2e_runs` Firestore collection when it finishes (see each repo's
// scripts/publish-e2e-run.js), keyed by the suite ids below. Keep `id` stable
// - it is the join key, and renaming one orphans its history.

/** An app in the suite, or the Cloud Functions behind them. */
export type ImpactApp = 'web' | 'admin' | 'reader' | 'functions';

export const IMPACT_APP_LABELS: Record<ImpactApp, string> = {
  web: 'Public Site',
  admin: 'Admin',
  reader: 'Library Reader',
  functions: 'Cloud Functions',
};

export interface E2eSpec {
  /** Stable id, `<suiteId>/<file stem>`. */
  id: string;
  title: string;
  /** What this proves, and why it is worth proving. */
  description: string;
  /** Functional areas, in the vocabulary staff use for the screens. */
  areas: string[];
  /** Every app that has to be working for this to pass. */
  apps: ImpactApp[];
  /** Roughly how many assertions-worth of coverage; context, not a contract. */
  tests: number;
}

export interface E2eSuite {
  /** Stable id - the `e2e_runs` document id. Never rename. */
  id: string;
  title: string;
  /** Which repo owns it. */
  repo: ImpactApp;
  /** How to run it. */
  command: string;
  /** What has to be up first. */
  prerequisite: string;
  /** What this whole layer is for, and what it deliberately leaves alone. */
  description: string;
  specs: E2eSpec[];
}

// ---------------------------------------------------------------- admin ---

const ADMIN_FUNCTIONAL: E2eSpec[] = [
  {
    id: 'e2e-admin/01-access', title: 'Access Control',
    description:
      'Staff can sign in at all, bad credentials are refused rather than silently ignored, ' +
      'signing out really ends the session, and an Employee cannot reach Admin Users - by ' +
      'URL or otherwise. That last one is the self-escalation door: anyone who can edit ' +
      'staff records can grant themselves everything.',
    areas: ['Sign-in', 'Roles & permissions'], apps: ['admin'], tests: 6,
  },
  {
    id: 'e2e-admin/02-campaigns', title: 'Campaigns',
    description:
      'The campaign list, opening one to its funnel and email timeline, the new-campaign ' +
      'wizard, and the status board. Also asserts the screen runs without throwing in the ' +
      'browser - a screen can render everything and still throw on every change-detection ' +
      'pass, which is what a module split produces.',
    areas: ['Campaigns'], apps: ['admin'], tests: 7,
  },
  {
    id: 'e2e-admin/03-campaign-email', title: 'Campaign Email Authoring',
    description:
      'Designing and scheduling a campaign email on the screen rewritten 2026-08-21. The ' +
      'highest-value spec in the suite: that rewrite changed no Cloud Function, so every ' +
      'integration test stays green whether this editor works or is a blank page. Covers the ' +
      'lazy chunk loading, the starter picker, the Schedule slide-over, the unsaved-changes ' +
      'guard, and that a save writes both the builder JSON and a recompiled html - the send ' +
      'engine only ever reads html.',
    areas: ['Campaigns', 'Email authoring'], apps: ['admin'], tests: 12,
  },
  {
    id: 'e2e-admin/04-email-history', title: 'Email History',
    description:
      'The read-only record of what actually went out, reached from a button in the ' +
      'Campaigns grid rather than a nav entry of its own - so the first thing this proves is ' +
      'that it is still reachable. Also pins that unsent DRAFTS never appear here, which is ' +
      'the bug found on 2026-08-21 and since fixed.',
    areas: ['Campaigns', 'Email history'], apps: ['admin'], tests: 7,
  },
  {
    id: 'e2e-admin/05-contacts', title: 'Contacts & Orders',
    description:
      'Finding a contact or a purchase and opening it, plus the fulfillment queue and ' +
      'organizations. The money truths behind these - refunds, customer de-duplication - are ' +
      'covered by the integration layer instead, where a browser adds nothing but latency.',
    areas: ['Contacts', 'Purchases', 'Fulfillment'], apps: ['admin'], tests: 6,
  },
  {
    id: 'e2e-admin/06-store', title: 'Store Catalog',
    description:
      'Products, coupons and sales as staff see them. Notably asserts a RETIRED product is ' +
      'still visible to staff even though the public store hides it - otherwise nobody could ' +
      'ever un-retire one.',
    areas: ['Store catalog'], apps: ['admin'], tests: 6,
  },
  {
    id: 'e2e-admin/07-library', title: 'Library Administration',
    description:
      'Reader accounts, licence grants and revokes, patron messages, and the content ' +
      'browser. The admin end of the admin/reader seam; the licence lifecycle itself is ' +
      'proven cross-app.',
    areas: ['Library users', 'Licences'], apps: ['admin'], tests: 6,
  },
  {
    id: 'e2e-admin/08-events', title: 'Events & Registrations',
    description:
      'Events, who registered, and the session counts staff plan against. Events is the only ' +
      'screen with internal permission TABS, so it is the one place a tab-level permission ' +
      'regression could hide.',
    areas: ['Events', 'Registrations'], apps: ['admin'], tests: 5,
  },
  {
    id: 'e2e-admin/09-content', title: 'Website Content',
    description:
      'Every editor behind what the public site renders from Firestore - DMM, testimonials, ' +
      'home page images, team. If one breaks the site does not go down; it quietly stops ' +
      'being updatable, which is worse because nothing alerts.',
    areas: ['Website content'], apps: ['admin'], tests: 3,
  },
  {
    id: 'e2e-admin/10-tools', title: 'Tools & Reports',
    description:
      'System email templates, the form builder, and the reports staff pull numbers from. ' +
      'Pins that a legacy template opens in the rich-text dialog and NOT the builder - ' +
      'opening one in the builder converts it on first save, and these are documents Cloud ' +
      'Functions substitute placeholders into.',
    areas: ['Email templates', 'Reports', 'Form builder'], apps: ['admin'], tests: 5,
  },
  {
    id: 'e2e-admin/11-admin-users', title: 'Staff Administration',
    description: 'The screen where access is granted - who may sign in, and with what role.',
    areas: ['Roles & permissions'], apps: ['admin'], tests: 5,
  },
];

const ADMIN_CROSS: E2eSpec[] = [
  {
    id: 'e2e-cross/01-store-to-fulfillment', title: 'Store to fulfillment',
    description:
      'Storefront pricing and cart through to an order appearing in admin fulfillment, and ' +
      'the buyer landing in Contacts as one record rather than a duplicate.',
    areas: ['Store catalog', 'Purchases', 'Fulfillment', 'Contacts'],
    apps: ['web', 'admin', 'functions'], tests: 3,
  },
  {
    id: 'e2e-cross/02-summit-registration', title: 'Summit registration',
    description: 'A public summit registration reaching the admin command centre and its session assignments.',
    areas: ['Events', 'Registrations'], apps: ['web', 'admin', 'functions'], tests: 3,
  },
  {
    id: 'e2e-cross/03-venue-truth', title: 'Venue truth',
    description: 'The venue snapshot staff maintain is what the public site actually renders.',
    areas: ['Events', 'Website content'], apps: ['web', 'admin'], tests: 2,
  },
  {
    id: 'e2e-cross/04-subscribe-to-report', title: 'Subscribe to report',
    description: 'A newsletter sign-up on the public site arriving in the admin subscriber report.',
    areas: ['Subscriptions', 'Reports'], apps: ['web', 'admin', 'functions'], tests: 3,
  },
  {
    id: 'e2e-cross/05-form-to-organization', title: 'Form to organization',
    description: 'A seminar request submitted publicly becoming an organization and a contact in admin.',
    areas: ['Forms', 'Organizations', 'Contacts'], apps: ['web', 'admin', 'functions'], tests: 3,
  },
  {
    id: 'e2e-cross/06-reader-license-lifecycle', title: 'Licence lifecycle',
    description:
      'A licence granted in admin opening the book in the reader, and a revoke closing it ' +
      'again. The single most consequential seam in the suite - it is what a patron pays for.',
    areas: ['Licences', 'Library users'], apps: ['admin', 'reader', 'functions'], tests: 5,
  },
  {
    id: 'e2e-cross/07-reader-message-and-revoke', title: 'Patron messaging and revoke',
    description: 'A staff message reaching the patron inbox, then account revoke and restore.',
    areas: ['Library users', 'Messaging'], apps: ['admin', 'reader', 'functions'], tests: 5,
  },
  {
    id: 'e2e-cross/08-reader-store-purchase-grant', title: 'Purchase grants a licence',
    description:
      'Buying a library product on the public site granting reader access automatically, via ' +
      'the purchase trigger. Money in one app, access in another.',
    areas: ['Purchases', 'Licences'], apps: ['web', 'reader', 'functions'], tests: 3,
  },
  {
    id: 'e2e-cross/09-campaign-offer-to-storefront', title: 'Offer to storefront',
    description: 'A campaign offer authored in admin showing up and pricing correctly on the public storefront.',
    areas: ['Campaigns', 'Offers', 'Store catalog'], apps: ['web', 'admin', 'functions'], tests: 3,
  },
  {
    id: 'e2e-cross/10-campaign-series-offer', title: 'Series offer',
    description: 'A campaign offer scoped to a product series, priced across the whole series on the storefront.',
    areas: ['Campaigns', 'Offers', 'Store catalog'], apps: ['web', 'admin', 'functions'], tests: 4,
  },
  {
    id: 'e2e-cross/11-early-bird', title: 'Early bird',
    description: 'Time-boxed early-bird pricing opening and closing on the public site as the campaign dictates.',
    areas: ['Campaigns', 'Offers', 'Events'], apps: ['web', 'admin', 'functions'], tests: 5,
  },
  {
    id: 'e2e-cross/12-signup-coupon', title: 'Signup coupon',
    description: 'A coupon issued on sign-up being honoured at checkout.',
    areas: ['Campaigns', 'Offers', 'Purchases'], apps: ['web', 'admin', 'functions'], tests: 3,
  },
];

// ------------------------------------------------------------------ web ---

const WEB_SPECS: E2eSpec[] = [
  {
    id: 'web-e2e/smoke', title: 'Smoke',
    description: 'The public site loads and its core routes answer.',
    areas: ['Public site'], apps: ['web'], tests: 3,
  },
  {
    id: 'web-e2e/store', title: 'Store and cart',
    description:
      'Store, e-books, cart and checkout shells load clean, and adding to the cart updates ' +
      'the header badge and drawer.',
    areas: ['Store catalog', 'Cart'], apps: ['web'], tests: 6,
  },
  {
    id: 'web-e2e/product-details', title: 'Product page',
    description:
      'The step between browsing and a cart, and until 2026-08-26 the largest uncovered hole ' +
      'in the storefront: the grid links through, the page renders a title and a price, and ' +
      'adding from here updates the cart.',
    areas: ['Store catalog'], apps: ['web'], tests: 6,
  },
  {
    id: 'web-e2e/checkout-server-pricing', title: 'Server-side pricing',
    description:
      'Checkout never sends pricing to the server and never computes its own total - the ' +
      'server is the price authority. Deliberately stops short of a real capture, which ' +
      'would write a purchase, mail a receipt and can charge a card.',
    areas: ['Checkout', 'Purchases'], apps: ['web', 'functions'], tests: 2,
  },
  {
    id: 'web-e2e/events', title: 'Events',
    description: 'Public event listings and detail pages.',
    areas: ['Events'], apps: ['web'], tests: 7,
  },
  {
    id: 'web-e2e/schedule', title: 'Attendee schedule',
    description:
      'The capability-URL schedule an attendee reaches from an email link - reachable ' +
      'without signing in, by design.',
    areas: ['Events', 'Registrations'], apps: ['web'], tests: 3,
  },
  {
    id: 'web-e2e/campaign-popup', title: 'Campaign popup',
    description:
      'The on-site popup a campaign drives, and the beacons it fires. Skips by design when ' +
      'no active popup fixture exists - seed one with scripts/seed-e2e-popup.js.',
    areas: ['Campaigns', 'Public site'], apps: ['web', 'functions'], tests: 9,
  },
  {
    id: 'web-e2e/impact-groups', title: 'Impact Groups finder',
    description: 'The public group finder, its search, and the join path into the reader.',
    areas: ['Impact Groups'], apps: ['web', 'functions'], tests: 13,
  },
  {
    id: 'web-e2e/discipleship-library', title: 'Discipleship Library page',
    description:
      'The marketing page linked from the FIRST slide of the home slider. Its first run ' +
      'found the page rendering with no header and no footer - visitors landed on the most ' +
      'promoted page on the site with no navigation.',
    areas: ['Public site'], apps: ['web'], tests: 9,
  },
  {
    id: 'web-e2e/content-pages', title: 'Content pages',
    description: 'The static and Firestore-driven content routes, and that each renders its own header and footer.',
    areas: ['Website content', 'Public site'], apps: ['web'], tests: 12,
  },
  {
    id: 'web-e2e/team-and-services', title: 'Team and services',
    description: 'Team and team detail, the four Equipping Groups pages, and six static service routes.',
    areas: ['Public site'], apps: ['web'], tests: 6,
  },
];

// --------------------------------------------------------------- reader ---

const READER_SPECS: E2eSpec[] = [
  {
    id: 'reader-e2e/auth', title: 'Auth and session',
    description:
      'Signup creates and signs in a new disciple, sign-out really clears the session, ' +
      'signing back in works, and an invalid password is rejected with a VISIBLE error ' +
      'rather than silently ignored.',
    areas: ['Sign-in'], apps: ['reader', 'functions'], tests: 0,
  },
  {
    id: 'reader-e2e/library-access', title: 'Library browsing and access',
    description:
      'A licensed disciple sees their books and can drill into units and lessons - and, the ' +
      'security half, an unlicensed one sees no books AND cannot reach a licensed lesson by ' +
      'URL. This is the paywall.',
    areas: ['Licences', 'Reading'], apps: ['reader'], tests: 0,
  },
  {
    id: 'reader-e2e/lesson-experience', title: 'Lesson experience',
    description:
      'A lesson\'s form schema renders, a submitted answer round-trips (save, reload, still ' +
      'there), and text highlighting persists.',
    areas: ['Reading', 'Submissions'], apps: ['reader'], tests: 0,
  },
  {
    id: 'reader-e2e/store', title: 'Store and purchases',
    description:
      'Products load and an invalid coupon is refused visibly; the online guard really ' +
      'redirects away from the store when offline rather than just hiding the menu entry.',
    areas: ['Store catalog', 'Purchases'], apps: ['reader', 'functions'], tests: 0,
  },
  {
    id: 'reader-e2e/groups', title: 'Impact Groups',
    description:
      'Create, browse, request to join, approve, group chat and 1:1 messaging - across three ' +
      'separate disciple sessions at once.',
    areas: ['Impact Groups', 'Messaging'], apps: ['reader', 'functions'], tests: 0,
  },
  {
    id: 'reader-e2e/settings', title: 'Settings and theme',
    description:
      'Dark mode and colour theme apply immediately AND survive a reload, proving they ' +
      'round-trip through the signed-in disciple\'s stored profile.',
    areas: ['Settings'], apps: ['reader'], tests: 0,
  },
  {
    id: 'reader-e2e/offline', title: 'Offline support',
    description:
      'Previously-visited books and lessons stay readable with no network, the offline ' +
      'indicator shows, and a write made offline is not lost.',
    areas: ['Reading', 'Offline'], apps: ['reader'], tests: 0,
  },
];

// ---------------------------------------------------------------- suites ---

export const E2E_CATALOG: E2eSuite[] = [
  {
    id: 'e2e-admin',
    title: 'Admin functional areas',
    repo: 'admin',
    command: 'npm run e2e:admin',
    prerequisite: 'Firebase emulator running and seeded (npm run emu, npm run emu:seed)',
    description:
      'One app, one emulator, the whole back office swept by functional area. Exists because ' +
      'most admin breakage is single-app UI breakage - a route moved, a lazy chunk broke, a ' +
      'grid stopped rendering - and booting the other apps to catch it is waste. The data and ' +
      'money truths belong to the integration layer instead.',
    specs: ADMIN_FUNCTIONAL,
  },
  {
    id: 'e2e-cross',
    title: 'Cross-app flows',
    repo: 'admin',
    command: 'npm run e2e:cross',
    prerequisite: 'Emulator running, plus all three dev servers (each repo\'s npm run start-emu)',
    description:
      'The flows that span more than one app, where nothing owned by a single repo can prove ' +
      'the whole path works. This is the only layer that would notice admin and the reader ' +
      'disagreeing about what a licence means.',
    specs: ADMIN_CROSS,
  },
  {
    id: 'web-e2e',
    title: 'Public site',
    repo: 'web',
    command: 'npx playwright test',
    prerequisite: 'Web dev server on :4200 (npm run start-local)',
    description:
      'The storefront and marketing site as a visitor meets it. Runs against live dev data ' +
      'rather than the emulator, so it also catches content that has gone missing.',
    specs: WEB_SPECS,
  },
  {
    id: 'reader-e2e',
    title: 'Library Reader',
    repo: 'reader',
    command: 'npm run e2e:<area>',
    prerequisite:
      'E2E_DISCIPLE_EMAIL / E2E_DISCIPLE_PASSWORD for an account that ALREADY holds a ' +
      'licensed book - there is no way to self-provision one',
    description:
      'The patron-facing app, area by area. Each area is its own script rather than one ' +
      'suite, because several need multiple simultaneous signed-in sessions.',
    specs: READER_SPECS,
  },
  {
    id: 'admin-smoke',
    title: 'Admin live smoke',
    repo: 'admin',
    command: 'npx playwright test',
    prerequisite: 'Admin dev server pointed at the live dev project (npm run start-dev)',
    description:
      'A hand-run smoke layer against the real dev project rather than the emulator. Kept ' +
      'because it exercises real data volumes and real Firestore indexes, which the emulator ' +
      'does not enforce.',
    specs: [],
  },
];

/** Every functional area named anywhere in the catalog, de-duplicated. */
export const E2E_AREAS: string[] = [
  ...new Set(E2E_CATALOG.flatMap((s) => s.specs.flatMap((spec) => spec.areas))),
].sort();

/** Every app the catalog touches, in a stable display order. */
export function appsInSuite(suite: E2eSuite): ImpactApp[] {
  const order: ImpactApp[] = ['web', 'admin', 'reader', 'functions'];
  const present = new Set(suite.specs.flatMap((s) => s.apps));
  return order.filter((a) => present.has(a));
}
