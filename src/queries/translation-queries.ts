// Plain-function Firestore reads shared between both apps' translation
// services. Each app's own CommonTranslationService/TranslationService/
// TitleTranslationService calls these for its shared reads and keeps its own
// write methods (the manager authors translations) and app-specific
// convenience wrappers (the reader's getTitlesForCurrentUser, which resolves
// the signed-in user's preferred locale via its own LibraryUserService) local.

import {
  Firestore,
  collection,
  collectionData,
  orderBy,
  query,
  where,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { CommonTranslation, LessonTranslation, TitleTranslation } from '../models/translation.models';

export function getCommonTranslations(firestore: Firestore): Observable<CommonTranslation[]> {
  return collectionData(collection(firestore, 'commonTranslations'), {
    idField: 'id',
  }) as Observable<CommonTranslation[]>;
}

// A lesson's translations, addressed via its full nested path (pre-prod
// hardening #7: the caller passes the already-loaded, ancestor-hydrated
// lesson, so no scan is needed and the read stays inside the license-gated
// subtree the caller already proved access to).
export function getTranslations(
  firestore: Firestore,
  lesson: { seriesId: string; bookId: string; unitId: string; id: string },
): Observable<LessonTranslation[]> {
  const ref = collection(
    firestore,
    'librarySeries',
    lesson.seriesId,
    'books',
    lesson.bookId,
    'units',
    lesson.unitId,
    'lessons',
    lesson.id,
    'translations',
  );
  return collectionData(query(ref, orderBy('createdAt')), {
    idField: 'id',
  }) as Observable<LessonTranslation[]>;
}

/**
 * One locale's translation of one lesson - what the reader app needs on
 * every lesson open (a patron reads in exactly one preferred language), as
 * opposed to getTranslations above, which the manager app's all-locale
 * editing screens still need. No orderBy: a lesson has at most one
 * translation doc per locale, so ordering is meaningless and omitting it
 * keeps this a single-field filter that needs no composite index. Offline
 * this is served from the persistent cache evaluating the filter over the
 * docs OfflinePrefetchService warmed with the UNFILTERED subcollection
 * fetch (a superset - deliberately, so a patron who changes preferred
 * language while offline still finds the new locale cached).
 */
export function getTranslationsForLocale(
  firestore: Firestore,
  lesson: { seriesId: string; bookId: string; unitId: string; id: string },
  locale: string,
): Observable<LessonTranslation[]> {
  const ref = collection(
    firestore,
    'librarySeries',
    lesson.seriesId,
    'books',
    lesson.bookId,
    'units',
    lesson.unitId,
    'lessons',
    lesson.id,
    'translations',
  );
  return collectionData(query(ref, where('locale', '==', locale)), {
    idField: 'id',
  }) as Observable<LessonTranslation[]>;
}

/**
 * One locale's shared chrome-text translations - the reader's per-lesson
 * render path only ever needs the signed-in patron's preferred language
 * (getCommonTranslations above stays for the manager's editing screens and
 * the reader's ChromeTranslationService, whose all-locale listener is what
 * makes an in-session language switch instant).
 */
export function getCommonTranslationsForLocale(
  firestore: Firestore,
  locale: string,
): Observable<CommonTranslation[]> {
  return collectionData(
    query(collection(firestore, 'commonTranslations'), where('locale', '==', locale)),
    { idField: 'id' },
  ) as Observable<CommonTranslation[]>;
}

/**
 * Every title translation recorded against one book/unit/lesson/series node,
 * across every locale - what the manager app's node-translation dialog needs
 * (it shows/edits all of a node's locales at once). nodeId alone is enough to
 * scope this query: Firestore auto-generated ids are unique across every
 * collection in this project, not just within one, so a single-field equality
 * filter is sufficient and needs no composite index.
 */
export function getTitleTranslationsByNode(firestore: Firestore, nodeId: string): Observable<TitleTranslation[]> {
  const ref = collection(firestore, 'titleTranslations');
  return collectionData(query(ref, where('nodeId', '==', nodeId)), {
    idField: 'id',
  }) as Observable<TitleTranslation[]>;
}

/**
 * Every book/unit/lesson title translation for one locale, library-wide,
 * keyed by nodeId - what the reader app's list screens need (one listener
 * covering every title on screen, rather than one per node) - see the
 * TitleTranslation doc comment for why nodeId alone is a safe map key.
 */
export function getTitlesForLocale(firestore: Firestore, locale: string): Observable<Map<string, string>> {
  const ref = collection(firestore, 'titleTranslations');
  return collectionData(query(ref, where('locale', '==', locale))).pipe(
    map((docs) => {
      const byNodeId = new Map<string, string>();
      for (const d of docs as { nodeId: string; title: string }[]) {
        byNodeId.set(d.nodeId, d.title);
      }
      return byNodeId;
    }),
  );
}
