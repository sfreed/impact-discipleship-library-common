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
import { Observable, map, of, switchMap } from 'rxjs';
import { CommonTranslation, LessonTranslation, TitleTranslation } from '../models/translation.models';
import { getLessonRef } from './library-queries';

export function getCommonTranslations(firestore: Firestore): Observable<CommonTranslation[]> {
  return collectionData(collection(firestore, 'commonTranslations'), {
    idField: 'id',
  }) as Observable<CommonTranslation[]>;
}

// Phase 3 migration: `lessons` is nested under librarySeries/{s}/books/{b}/
// units/{u} now, not a flat top-level collection, so a bare lessonId can no
// longer address `lessons/{lessonId}/translations` directly - the lesson's
// own doc ref is resolved first (getLessonRef, a collectionGroup scan - see
// library-queries.ts's own comment), then this subscribes to that lesson's
// now-nested `translations` subcollection. switchMap rather than a one-shot
// lookup so this stays a live listener like every other read in this file.
export function getTranslations(firestore: Firestore, lessonId: string): Observable<LessonTranslation[]> {
  return getLessonRef(firestore, lessonId).pipe(
    switchMap((lessonRef) => {
      if (!lessonRef) {
        return of([]);
      }
      const ref = collection(lessonRef, 'translations');
      return collectionData(query(ref, orderBy('createdAt')), {
        idField: 'id',
      }) as Observable<LessonTranslation[]>;
    }),
  );
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
