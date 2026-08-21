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
 *  functionUrl('prod', 'create_paypal_order'). Callables don't need this -
 *  httpsCallable resolves them from the Firebase app's projectId. */
export const functionUrl = (project: ImpactProjectKey, functionName: string): string =>
  `${functionsBaseUrl(project)}/${functionName}`;

export type ImpactAppKey = 'web' | 'admin' | 'reader';

/** The canonical public URL of each app per environment - what the other
 *  apps link to (admin's publicSiteUrl, reader's webAppUrl, the emulated
 *  dev servers on 4200/5200/4300). */
export const APP_URLS: Readonly<Record<ImpactAppKey, Readonly<Record<ImpactProjectKey, string>>>> = {
  web: {
    dev: 'https://impactdisciplesdev-public.web.app',
    prod: 'https://impactdisciples.com',
    emulator: 'http://localhost:4200',
  },
  admin: {
    dev: 'https://impactdisciplesdev-admin.web.app',
    prod: 'https://impactdisciples-admin.web.app',
    emulator: 'http://localhost:5200',
  },
  reader: {
    dev: 'https://impactdisciplesdev-library.web.app',
    prod: 'https://library.impactdisciples.com',
    emulator: 'http://localhost:4300',
  },
};

/** Every browser origin the web and admin apps are served from - the
 *  allow-list functions/src/utils/security.functions.ts's restrictedCors
 *  enforces (mirrored there by hand until functions consume this file). */
export const CORS_ALLOWED_ORIGINS: readonly string[] = [
  // web, production (custom domain + Firebase-assigned)
  'https://impactdisciples.com',
  'https://www.impactdisciples.com',
  'https://impactdisciples-public.web.app',
  'https://impactdisciples-public.firebaseapp.com',
  // web, dev
  'https://impactdisciplesdev-public.web.app',
  'https://impactdisciplesdev-public.firebaseapp.com',
  // admin, production
  'https://impactdisciples-admin.web.app',
  'https://impactdisciples-admin.firebaseapp.com',
  // admin, dev
  'https://impactdisciplesdev-admin.web.app',
  'https://impactdisciplesdev-admin.firebaseapp.com',
  // local development
  'http://localhost:4200',
  'http://localhost:5200',
];
