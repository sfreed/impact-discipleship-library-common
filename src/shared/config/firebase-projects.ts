// The Impact Suite's Firebase projects and app URLs - ONE place for the
// public web-app configs and the conventions every app's environment file
// used to hand-copy (2026-08-20 sweep: the same three config blocks were
// duplicated 11 times across web/admin/reader, and function URLs ~80
// times, with drift - e.g. the admin's dev default carried prod's apiKey).
//
// Everything here is PUBLIC by nature (Firebase web-app configs are shipped
// to browsers; origins are, well, origins) - never add a secret.
//
// Kept strict-clean and dependency-free on purpose: the reader app compiles
// it under full `strict`, and the functions contract (Stage 2e) may pull it
// into functions/ as well.

import type { HttpFunctionName } from '../contract/functions-contract';

export type ImpactProjectKey = 'dev' | 'prod' | 'emulator';

export interface FirebaseWebAppConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export const FIREBASE_PROJECTS: Readonly<Record<ImpactProjectKey, FirebaseWebAppConfig>> = {
  // impactdisciplesdev - development for all three apps; `ng serve` default.
  dev: {
    apiKey: 'AIzaSyDuxbnrsCjpHqlNauBWsaSrQHChUN-w008',
    authDomain: 'impactdisciplesdev.firebaseapp.com',
    projectId: 'impactdisciplesdev',
    storageBucket: 'impactdisciplesdev.appspot.com',
    messagingSenderId: '989008672868',
    appId: '1:989008672868:web:d2ee543e60c5e927260771',
    measurementId: 'G-1EEHPL0SRD',
  },
  // impactdisciples-a82a8 - production (web + admin live; reader repointed
  // at the 2026-08-17 cutover).
  prod: {
    apiKey: 'AIzaSyDRfdv2XgpLQ-ll2oxpEEMyhtC75rzkP4c',
    authDomain: 'impactdisciples-a82a8.firebaseapp.com',
    projectId: 'impactdisciples-a82a8',
    storageBucket: 'impactdisciples-a82a8.appspot.com',
    messagingSenderId: '562759240809',
    appId: '1:562759240809:web:7d6fa117db35b887b6a6f8',
    measurementId: 'G-KJL13HB8DV',
  },
  // The admin repo's Firebase Emulator Suite program (fake project id; the
  // emulators accept any non-empty apiKey).
  emulator: {
    apiKey: 'demo-api-key',
    authDomain: 'demo-impact.firebaseapp.com',
    projectId: 'demo-impact',
    storageBucket: 'demo-impact.appspot.com',
    messagingSenderId: '0',
    appId: '1:0:web:demo',
  },
};

// Every Cloud Function in the suite deploys to us-central1 (no region()
// or setGlobalOptions anywhere in functions/src) - if that ever changes,
// change it here and every URL follows.
export const FUNCTIONS_REGION = 'us-central1';

export const functionsBaseUrl = (project: ImpactProjectKey): string =>
  project === 'emulator'
    ? `http://127.0.0.1:5001/${FIREBASE_PROJECTS.emulator.projectId}/${FUNCTIONS_REGION}`
    : `https://${FUNCTIONS_REGION}-${FIREBASE_PROJECTS[project].projectId}.cloudfunctions.net`;

/** URL of an HTTP (onRequest) Cloud Function, e.g.
 *  functionUrl('prod', HTTP_FUNCTIONS.create_paypal_order). The name must
 *  come from the shared contract (contract/functions-contract.ts), so a
 *  function that's renamed or removed fails the consumer's compile instead
 *  of 404ing in production. Callables don't need this - httpsCallable
 *  resolves them from the Firebase app's projectId. */
export const functionUrl = (project: ImpactProjectKey, functionName: HttpFunctionName): string =>
  `${functionsBaseUrl(project)}/${functionName}`;

export type ImpactAppKey = 'web' | 'admin' | 'reader';

/** The canonical public URL of each app per environment - what the other
 *  apps link to (admin's publicSiteUrl, reader's webAppUrl, the local dev
 *  servers).
 *
 *  LOCAL PORTS ARE A FIXED RULE (2026-08-26). The thousands digit is the
 *  APP, the last digit is the BACKEND:
 *
 *      web 4200 | admin 5200 | reader 6200     -> live data (dev project)
 *      web 4201 | admin 5201 | reader 6201     -> Firebase emulator
 *
 *  Before this, an app's emulator server and its dev-data server shared a
 *  port (admin both on 5200, web both on 4200) while every Playwright
 *  webServer used `reuseExistingServer: true`. That combination silently
 *  binds a suite to whatever happened to be running: the cross-app suite,
 *  whose own header promises it cannot touch impactdisciplesdev, would
 *  have driven the DEV-backed admin server had one been up - and on
 *  2026-08-26 port 4200 was serving the READER while the cross config
 *  expected web there. One port per app per backend makes that
 *  unrepresentable rather than merely unlikely. */
export const APP_URLS: Readonly<Record<ImpactAppKey, Readonly<Record<ImpactProjectKey, string>>>> = {
  web: {
    dev: 'https://impactdisciplesdev-public.web.app',
    prod: 'https://impactdisciples.com',
    emulator: 'http://localhost:4201',
  },
  admin: {
    dev: 'https://impactdisciplesdev-admin.web.app',
    prod: 'https://impactdisciples-admin.web.app',
    emulator: 'http://localhost:5201',
  },
  reader: {
    dev: 'https://impactdisciplesdev-library.web.app',
    prod: 'https://library.impactdisciples.com',
    emulator: 'http://localhost:6201',
  },
};

/** Each app's LOCAL dev server when it is pointed at live (dev-project)
 *  data - the x200 half of the port rule documented on APP_URLS above.
 *  APP_URLS.<app>.emulator is the x201 half. Import one of these rather
 *  than writing a localhost literal, so the rule has exactly one home. */
export const LOCAL_APP_URLS: Readonly<Record<ImpactAppKey, string>> = {
  web: 'http://localhost:4200',
  admin: 'http://localhost:5200',
  reader: 'http://localhost:6200',
};

/**
 * Every browser origin the ADMIN app is served from.
 *
 * A CONNECTED DOMAIN IS AN ORIGIN TOO, and this list exists because that has
 * now been learned twice from the same domain:
 *
 *   2026-09-03  restrictedCors did not name admin.impactdisciples.com, so the
 *               first Print Label from it after the fail-open fix was refused
 *               at the preflight.
 *   2026-09-04  the web app's page previewer assembled its own allow-list from
 *               APP_URLS.admin.*, which names only the Firebase-assigned
 *               hosts. Staff work from the custom domain, so every preview
 *               message was dropped on arrival: hovering a section outlined
 *               nothing and an unsaved edit never reached the frame. Both
 *               looked like the previewer being "not very live"; neither had
 *               anything to do with the previewer.
 *
 * APP_URLS.admin is where the app IS, for building a link. This is every
 * origin it may ARRIVE FROM, for deciding whether to trust it - and the two
 * are not the same list. Anything gating an incoming admin request or message
 * must use THIS one.
 */
export const ADMIN_APP_ORIGINS: readonly string[] = [
  // production: custom domain first, because it is the one staff actually use
  'https://admin.impactdisciples.com',
  APP_URLS.admin.prod,
  'https://impactdisciples-admin.firebaseapp.com',
  // dev
  APP_URLS.admin.dev,
  'https://impactdisciplesdev-admin.firebaseapp.com',
  // local: emulator-backed (x201) and live-data (x200)
  APP_URLS.admin.emulator,
  LOCAL_APP_URLS.admin,
];

/** Every browser origin the web and admin apps are served from - the
 *  allow-list functions/src/utils/security.functions.ts's restrictedCors
 *  enforces (mirrored there by hand until functions consume this file).
 *  The admin half is ADMIN_APP_ORIGINS, so a newly connected admin domain
 *  is named once and both CORS and the page previewer learn it together. */
// Deduped on the way out: ADMIN_APP_ORIGINS carries the local admin servers
// (a previewer running on localhost has to be trusted too) and the local block
// below lists every app's, so 5200/5201 are named in both. Naming an origin
// twice is harmless to includes() but reads as a merge nobody checked.
export const CORS_ALLOWED_ORIGINS: readonly string[] = [...new Set<string>([
  // web, production (custom domain + Firebase-assigned)
  'https://impactdisciples.com',
  'https://www.impactdisciples.com',
  'https://impactdisciples-public.web.app',
  'https://impactdisciples-public.firebaseapp.com',
  // web, dev
  'https://impactdisciplesdev-public.web.app',
  'https://impactdisciplesdev-public.firebaseapp.com',
  // admin, every environment - see ADMIN_APP_ORIGINS above for why the
  // custom domain leads that list. Spread rather than repeated: this list and
  // the previewer's had already drifted apart once.
  ...ADMIN_APP_ORIGINS,
  // reader, production (custom domain + Firebase-assigned) and dev. The
  // reader calls only callables today, which are not origin-gated, so
  // nothing breaks without these - listed so the first onRequest call it
  // ever makes does not repeat the admin custom-domain incident above.
  'https://library.impactdisciples.com',
  'https://impactdisciples-library.web.app',
  'https://impactdisciples-library.firebaseapp.com',
  'https://impactdisciplesdev-library.web.app',
  'https://impactdisciplesdev-library.firebaseapp.com',
  // local development - see APP_URLS above for the port rule. Both
  // backends are listed: a browser calling a deployed function from a
  // local page is origin-checked the same either way.
  'http://localhost:4200',
  'http://localhost:4201',
  'http://localhost:5200',
  'http://localhost:5201',
  'http://localhost:6200',
  'http://localhost:6201',
])];
