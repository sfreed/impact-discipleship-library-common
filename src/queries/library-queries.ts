// Plain-function Firestore reads for the reader app's library content.
// (Historically shared with the now-retired manager app; the admin app has
// its own bespoke services and never imports these.)
//
// Phase 3 nested schema: librarySeries/{seriesId}/books/{bookId}/units/
// {unitId}/lessons/{lessonId}. Pre-prod hardening #7 reshaped HOW these
// read: every unit/lesson read is a CONSTRAINED nested-path query, so
// firestore.rules' canReadBook(bookId-path-variable) license gate is
// provable and enforced SERVER-side - the interim unconstrained
// collectionGroup scans (which rules could only gate client-side) are gone,
// and the units/lessons collection-group rules are now staff-only.
//
// `books` metadata deliberately stays a signedIn-open collectionGroup scan:
// any signed-in patron may read book titles/covers regardless of license
// (Impact Groups browses books they don't own), and a bare bookId can't be
// addressed any other way without knowing its series. Every deeper read
// resolves the book's ref from that scan first, then walks real paths.
//
// Ancestor ids (seriesId/bookId/unitId) are not stored fields - they're
// hydrated onto the returned models from each doc's own ref path.

import {
  DocumentReference,
  Firestore,
  QueryDocumentSnapshot,
  collection,
  collectionGroup,
  collectionSnapshots,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from '@angular/fire/firestore';
import { Observable, map, of, switchMap } from 'rxjs';
import { Book, Lesson, Unit } from '../models/library.models';

function seriesIdOf(bookRef: DocumentReference): string {
  return bookRef.parent.parent?.id ?? '';
}

function unitFromSnap(d: QueryDocumentSnapshot | { id: string; ref: DocumentReference; data: () => unknown }): Unit {
  const bookRef = d.ref.parent.parent;
  return {
    id: d.id,
    bookId: bookRef?.id ?? '',
    seriesId: bookRef ? seriesIdOf(bookRef) : '',
    ...(d.data() as object),
  } as Unit;
}

function lessonFromSnap(d: { id: string; ref: DocumentReference; data: () => unknown }): Lesson {
  const unitRef = d.ref.parent.parent;
  const bookRef = unitRef?.parent.parent;
  return {
    id: d.id,
    unitId: unitRef?.id ?? '',
    bookId: bookRef?.id ?? '',
    seriesId: bookRef ? seriesIdOf(bookRef) : '',
    ...(d.data() as object),
  } as Lesson;
}

/** The book's own doc ref, resolved from the signedIn-open `books`
 *  collectionGroup - the entry point every deeper (license-gated) nested
 *  read starts from. */
export function getBookRef(firestore: Firestore, bookId: string): Observable<DocumentReference | undefined> {
  return collectionSnapshots(collectionGroup(firestore, 'books')).pipe(
    map((snaps) => snaps.find((s) => s.id === bookId)?.ref),
  );
}

export function getBook(firestore: Firestore, bookId: string): Observable<Book | undefined> {
  return collectionSnapshots(collectionGroup(firestore, 'books')).pipe(
    map((snaps) => {
      const found = snaps.find((s) => s.id === bookId);
      return found
        ? ({ id: found.id, seriesId: seriesIdOf(found.ref), ...found.data() } as Book)
        : undefined;
    }),
  );
}

/** A book's units via its real nested path - the query's own parent path
 *  carries bookId, so firestore.rules' canReadBook gate is provable and
 *  a patron without a license is denied SERVER-side. */
export function getUnits(firestore: Firestore, bookId: string): Observable<Unit[]> {
  return getBookRef(firestore, bookId).pipe(
    switchMap((bookRef) => {
      if (!bookRef) {
        return of([] as Unit[]);
      }
      return collectionSnapshots(query(collection(bookRef, 'units'), orderBy('order'))).pipe(
        map((snaps) => snaps.map((s) => unitFromSnap(s))),
      );
    }),
  );
}

/** A unit's lessons via its real nested path - takes the hydrated unit
 *  (not a bare id) so the full path is addressable without a scan. */
export function getLessons(
  firestore: Firestore,
  unit: { seriesId: string; bookId: string; id: string },
): Observable<Lesson[]> {
  const ref = collection(
    firestore,
    'librarySeries',
    unit.seriesId,
    'books',
    unit.bookId,
    'units',
    unit.id,
    'lessons',
  );
  return collectionSnapshots(query(ref, orderBy('order'))).pipe(
    map((snaps) => snaps.map((s) => lessonFromSnap(s))),
  );
}

/**
 * Resolves one lesson (and its unit) within a known book - the lesson
 * route carries bookId, so this never needs a lessons scan: it lists the
 * book's units (license-gated by path), then probes each unit's
 * lessons/{lessonId} doc directly. A patron without a license fails at
 * the units read, exactly like every other gated read - callers treat a
 * rejection as access denied.
 */
export async function findLesson(
  firestore: Firestore,
  bookId: string,
  lessonId: string,
): Promise<{ lesson: Lesson; unit: Unit } | undefined> {
  const booksSnap = await getDocs(collectionGroup(firestore, 'books'));
  const bookRef = booksSnap.docs.find((s) => s.id === bookId)?.ref;
  if (!bookRef) {
    return undefined;
  }
  const unitsSnap = await getDocs(query(collection(bookRef, 'units'), orderBy('order')));
  const probes = await Promise.all(
    unitsSnap.docs.map(async (unitDoc) => {
      const lessonSnap = await getDoc(doc(unitDoc.ref, 'lessons', lessonId));
      return lessonSnap.exists() ? { unitDoc, lessonSnap } : undefined;
    }),
  );
  const hit = probes.find((p) => p !== undefined);
  if (!hit) {
    return undefined;
  }
  return {
    lesson: lessonFromSnap(hit.lessonSnap as unknown as { id: string; ref: DocumentReference; data: () => unknown }),
    unit: unitFromSnap(hit.unitDoc),
  };
}

