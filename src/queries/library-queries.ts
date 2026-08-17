// Plain-function Firestore reads shared between impact-discipleship-library-new
// (read-only) and impact-discipleship-library-manager-new (read/write) - both
// apps' own LibraryService call these for the reads that are identical between
// them, then keep their app-specific methods (series/CRUD/versioning for the
// manager, getBooksForUser for the reader) locally. Plain functions rather than
// an injectable service so each app's own DI-registered service stays the
// single call site its components inject, without fighting Angular DI across
// two independently-built apps for a class that would otherwise have no other
// members.
//
// Phase 3 migration: library content moved from flat top-level collections
// (books/units/lessons, each carrying a denormalized parent-id field like
// bookId/unitId) into a nested schema - librarySeries/{seriesId}/books/
// {bookId}/units/{unitId}/lessons/{lessonId} - see the consolidation plan's
// Phase 3. A bare id (all of this module's callers ever have in hand - route
// params, licensedBookIds, etc.) no longer addresses a doc directly, so every
// "get by id" below scans the relevant collectionGroup and filters/maps to
// the matching doc client-side instead - the same "drilling up" pattern
// impactdisciples-admin's own Library services use, accepted as fine at this
// library's real scale (well under a thousand docs total per collection).
// Sorting also moved client-side (rather than a Firestore-level orderBy) so
// none of this needs a COLLECTION_GROUP-scope index to be created.
//
// Parent-id fields (seriesId/bookId/unitId) are no longer stored in
// Firestore itself (the migration script dropped them on write) - they're
// hydrated back onto the returned model from the matched doc's own path
// instead, so every existing caller that reads book.seriesId/unit.bookId/
// lesson.unitId/lesson.bookId keeps working unchanged.

import {
  DocumentReference,
  Firestore,
  QueryDocumentSnapshot,
  collectionGroup,
  collectionSnapshots,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Book, Lesson, Unit } from '../models/library.models';

function fromSnap<T>(snap: QueryDocumentSnapshot, extra: Record<string, unknown>): T {
  return { id: snap.id, ...extra, ...snap.data() } as T;
}

/** The nested doc a `books` collectionGroup match sits under is always
 *  librarySeries/{seriesId}/books/{bookId} - one parent hop up from the
 *  `books` subcollection itself. */
function seriesIdOf(bookRef: DocumentReference): string {
  return bookRef.parent.parent?.id ?? '';
}

/** A `units` collectionGroup match sits under .../books/{bookId}/units -
 *  one parent hop up from the `units` subcollection itself. */
function bookIdOfUnit(unitRef: DocumentReference): string {
  return unitRef.parent.parent?.id ?? '';
}

/** A `lessons` collectionGroup match sits under .../units/{unitId}/lessons
 *  - one parent hop up for unitId, three more for the grandparent book. */
function ancestorIdsOfLesson(lessonRef: DocumentReference): { unitId: string; bookId: string } {
  const unitRef = lessonRef.parent.parent;
  return {
    unitId: unitRef?.id ?? '',
    bookId: unitRef ? bookIdOfUnit(unitRef) : '',
  };
}

export function getBook(firestore: Firestore, bookId: string): Observable<Book | undefined> {
  return collectionSnapshots(collectionGroup(firestore, 'books')).pipe(
    map((snaps) => {
      const found = snaps.find((s) => s.id === bookId);
      return found ? fromSnap<Book>(found, { seriesId: seriesIdOf(found.ref) }) : undefined;
    }),
  );
}

export function getUnits(firestore: Firestore, bookId: string): Observable<Unit[]> {
  return collectionSnapshots(collectionGroup(firestore, 'units')).pipe(
    map((snaps) =>
      snaps
        .filter((s) => bookIdOfUnit(s.ref) === bookId)
        .map((s) => fromSnap<Unit>(s, { bookId }))
        .sort((a, b) => a.order - b.order),
    ),
  );
}

export function getUnit(firestore: Firestore, unitId: string): Observable<Unit | undefined> {
  return collectionSnapshots(collectionGroup(firestore, 'units')).pipe(
    map((snaps) => {
      const found = snaps.find((s) => s.id === unitId);
      return found ? fromSnap<Unit>(found, { bookId: bookIdOfUnit(found.ref) }) : undefined;
    }),
  );
}

export function getLessons(firestore: Firestore, unitId: string): Observable<Lesson[]> {
  return collectionSnapshots(collectionGroup(firestore, 'lessons')).pipe(
    map((snaps) =>
      snaps
        .filter((s) => s.ref.parent.parent?.id === unitId)
        .map((s) => fromSnap<Lesson>(s, { unitId, bookId: ancestorIdsOfLesson(s.ref).bookId }))
        .sort((a, b) => a.order - b.order),
    ),
  );
}

export function getLesson(firestore: Firestore, lessonId: string): Observable<Lesson | undefined> {
  return collectionSnapshots(collectionGroup(firestore, 'lessons')).pipe(
    map((snaps) => {
      const found = snaps.find((s) => s.id === lessonId);
      return found ? fromSnap<Lesson>(found, ancestorIdsOfLesson(found.ref)) : undefined;
    }),
  );
}

/**
 * Resolves a lesson id to its full nested Firestore doc reference -
 * exported so translation-queries.ts's getTranslations() can address the
 * lesson's now-nested `translations` subcollection without duplicating
 * this same collectionGroup scan.
 */
export function getLessonRef(firestore: Firestore, lessonId: string): Observable<DocumentReference | undefined> {
  return collectionSnapshots(collectionGroup(firestore, 'lessons')).pipe(
    map((snaps) => snaps.find((s) => s.id === lessonId)?.ref),
  );
}
