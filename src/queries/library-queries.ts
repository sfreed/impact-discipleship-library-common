// Plain-function Firestore reads shared between impact-discipleship-library-new
// (read-only) and impact-discipleship-library-manager-new (read/write) - both
// apps' own LibraryService call these for the reads that are identical between
// them, then keep their app-specific methods (series/CRUD/versioning for the
// manager, getBooksForUser for the reader) locally. Plain functions rather than
// an injectable service so each app's own DI-registered service stays the
// single call site its components inject, without fighting Angular DI across
// two independently-built apps for a class that would otherwise have no other
// members.

import { Firestore, collection, doc, docData, collectionData, orderBy, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Book, Lesson, Unit } from '../models/library.models';

export function getBook(firestore: Firestore, bookId: string): Observable<Book | undefined> {
  const ref = doc(firestore, 'books', bookId);
  return docData(ref, { idField: 'id' }) as Observable<Book | undefined>;
}

export function getUnits(firestore: Firestore, bookId: string): Observable<Unit[]> {
  const ref = collection(firestore, 'units');
  return collectionData(query(ref, where('bookId', '==', bookId), orderBy('order')), {
    idField: 'id',
  }) as Observable<Unit[]>;
}

export function getUnit(firestore: Firestore, unitId: string): Observable<Unit | undefined> {
  const ref = doc(firestore, 'units', unitId);
  return docData(ref, { idField: 'id' }) as Observable<Unit | undefined>;
}

export function getLessons(firestore: Firestore, unitId: string): Observable<Lesson[]> {
  const ref = collection(firestore, 'lessons');
  return collectionData(query(ref, where('unitId', '==', unitId), orderBy('order')), {
    idField: 'id',
  }) as Observable<Lesson[]>;
}

export function getLesson(firestore: Firestore, lessonId: string): Observable<Lesson | undefined> {
  const ref = doc(firestore, 'lessons', lessonId);
  return docData(ref, { idField: 'id' }) as Observable<Lesson | undefined>;
}
