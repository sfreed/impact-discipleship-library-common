import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  Firestore,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  DocumentData,
  onSnapshot,
  OrderByDirection,
  QueryConstraint,
  QueryDocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
  UpdateData,
  WriteBatch,
} from 'firebase/firestore';
import { BaseModel } from '../models/base.model';
import { tenantPath } from '../lists/tenancy';

// THE Firestore data-access layer for the web site and the admin app.
//
// Until 2026-09-05 (review item 9) each app carried its own copy of this
// class - 247 differing lines between them - and both copies of the twenty
// record services that extend BaseService over it. The two had grown apart
// in the ways that matter: the admin had paging, partial updates and
// batches the web lacked; the web had ordered reads/streams and an
// Observable single-document stream the admin lacked; and add()/update()
// disagreed about whether to read the written document back. This is the
// superset, with ONE answer to each question, and both apps' old files are
// re-exports of it.
//
// The reader app has no DAO (it reads through the submodule's queries/ and
// its own services) and excludes this folder from its compile.

// One page of a getPage() call. cursor is the raw QueryDocumentSnapshot for
// the last row in this page - pass it back into the next getPage() call's
// `cursor` param to fetch the next page (Firestore's own startAfter()
// cursor, not an offset - offset-based paging re-reads every prior page on
// each call, which is exactly the read-volume problem this exists to avoid).
export interface PagedResult<T> {
  items: T[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

// The per-collection deserialization hook a service may install (see
// BaseService.fromFirestore). It receives the raw document data with `id`
// already set and returns the model - in practice every implementation
// mutates and returns the same object (converting Timestamps to Dates).
export type FromFirestore<T> = (data: T) => T;

@Injectable({
  providedIn: 'root'
})
export class FirebaseDAO<T extends BaseModel> {

  constructor(public fs: Firestore) {}

  /**
   * Where a collection actually lives.
   *
   * EVERY path in this class goes through here. A site's own content is
   * nested under `tenants/{tenantId}`; everything else is returned unchanged.
   * See tenancy.ts for why, and for the list - the list is the whole
   * of the decision, so nothing in this file needs to know which is which.
   *
   * The leading slash is kept because that is how every call site already
   * reads, and Firestore treats it as absolute either way.
   */
  private path(table: string): string {
    return '/' + tenantPath(table);
  }

  // ---- One-time reads --------------------------------------------------

  // limitCount is optional and defaults to unbounded (existing behavior) --
  // pass it to cap how many documents a page pulls back instead of the
  // entire collection.
  public getAll(table: string, fromFirestore?: FromFirestore<T>, limitCount?: number): Promise<T[]>{
    const constraints: QueryConstraint[] = limitCount ? [limit(limitCount)] : [];

    return getDocs(query(collection(this.fs, this.path(table)), ...constraints)).then(docs => {
      return this.getDocListFromPromise(docs, fromFirestore);
    });
  }

  // getAll() with a server-side orderBy(orderField, 'desc') so the newest
  // documents survive the limit() cap -- a plain limit() keeps whichever
  // docs Firestore returns first (doc-id order), not the newest. Single
  // field, no where clause, so no composite index is needed.
  public getAllOrdered(table: string, orderField: string, fromFirestore?: FromFirestore<T>, limitCount?: number): Promise<T[]>{
    const constraints: QueryConstraint[] = [orderBy(orderField, 'desc')];
    if (limitCount) constraints.push(limit(limitCount));

    return getDocs(query(collection(this.fs, this.path(table)), ...constraints)).then(docs => {
      return this.getDocListFromPromise(docs, fromFirestore);
    });
  }

  public getAllByValue(table: string, field: string, value: unknown, fromFirestore?: FromFirestore<T>, limitCount?: number): Promise<T[]>{
    const constraints: QueryConstraint[] = [where(field, "==", value)];
    if (limitCount) constraints.push(limit(limitCount));

    return getDocs(query(collection(this.fs, this.path(table)), ...constraints)).then(docs => {
      return this.getDocListFromPromise(docs, fromFirestore);
    });
  }

  public queryAllByMultiValue(table: string, queries: QueryParam[], fromFirestore?: FromFirestore<T>, limitCount?: number): Promise<T[]>{
    const queryConstraints: QueryConstraint[] = queries.map((query) =>
      where(query.field, query.operation, query.value),
    );
    if (limitCount) queryConstraints.push(limit(limitCount));

    return getDocs(query(collection(this.fs, this.path(table)), ...queryConstraints)).then(docs => {
      return this.getDocListFromPromise(docs, fromFirestore);
    });
  }

  // One-time (not live) fetch of a single page, ordered by orderByField, cursoring
  // via startAfter(cursor) rather than an offset. Used by list screens with large
  // collections (e.g. Products, Customers, Log Messages) instead of streamAll()'s
  // "subscribe to the entire collection forever" - see PagedCollectionSource for
  // the client-side accumulator this is meant to be driven by.
  // `filters` (optional) prepends where() constraints to the page query -
  // e.g. a screen paging only one type's rows out of a shared collection
  // (Sent Emails over campaigns type=='email'). Any filter field other than
  // orderByField needs a composite index on (filterField, orderByField) -
  // add it to firestore.indexes.json, don't discover it in prod.
  public async getPage(
    table: string,
    pageSize: number,
    cursor: QueryDocumentSnapshot<DocumentData> | null,
    orderByField: string,
    orderDirection: OrderByDirection = 'asc',
    filters?: QueryParam[],
    fromFirestore?: FromFirestore<T>
  ): Promise<PagedResult<T>> {
    const constraints: QueryConstraint[] = (filters ?? []).map((f) => where(f.field, f.operation, f.value));
    constraints.push(orderBy(orderByField, orderDirection));
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(limit(pageSize));

    const snap = await getDocs(query(collection(this.fs, this.path(table)), ...constraints));
    const items = this.getDocListFromPromise(snap, fromFirestore);
    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

    return {
      items,
      cursor: lastDoc,
      // Exactly pageSize docs came back -> there's likely a next page.
      // Fewer than pageSize -> this was the tail of the collection.
      hasMore: snap.docs.length === pageSize
    };
  }

  // Resolves undefined for a document that does not exist - it always did,
  // but until strict null checks (2026-09-05) the signature said Promise<T>
  // and every caller was free to dereference the result. Callers guard.
  public getById(id: string, table: string, fromFirestore?: FromFirestore<T>): Promise<T | undefined>{
    return getDoc(doc(this.fs, this.path(table) + '/' + id)).then(async doc => {
      if(doc.exists()){
        const retval: T = doc.data() as T;
        retval.id = doc.id;
        return fromFirestore? fromFirestore(retval) : retval;
      }
      return undefined;
    })
  }

  // ---- Writes ------------------------------------------------------------

  // No read-back after the write - the written value, with its new id, is
  // handed back through fromFirestore. The admin's copy used to read the
  // document straight back and throw if it could not; the web's never did,
  // because some collections are write-only for an anonymous visitor under
  // firestore.rules (log-messages, affilliate_sales, mail) and the read-back
  // failed the call after the data had already landed - the 2026-09-04
  // login-screen hang was exactly that. Echoing is equivalent for every
  // writer in either app: none uses serverTimestamp() or another
  // server-computed field. One answer now.
  public add(value: T, table: string, fromFirestore?: FromFirestore<T>): Promise<T>{
    return addDoc(collection(this.fs, this.path(table)), value).then(doc => {
      const retval = { ...value, id: doc.id };
      return fromFirestore ? fromFirestore(retval) : retval;
    });
  }

  /**
   * Creates a document and returns only its id. add() above echoes the
   * input back as the document; this is for callers that have no business
   * with the document at all - a log line, written by a visitor who may not
   * read log-messages.
   */
  public create(value: T, table: string): Promise<string> {
    return addDoc(collection(this.fs, this.path(table)), value).then((ref) => ref.id);
  }

  // Whole-document write (setDoc, no merge): omitted fields are DELETED.
  // Echoes the input like add() - see its comment.
  public async update(id: string, value: T, table: string, fromFirestore?: FromFirestore<T>): Promise<T>{
    await setDoc(doc(this.fs, this.path(table) + '/' + id), value);

    const retval = { ...value, id };
    return fromFirestore ? fromFirestore(retval) : retval;
  }

  // PARTIAL update via updateDoc - the counterpart to update()'s whole-doc
  // setDoc. Contract:
  // - Only the fields named in `partial` change; everything else on the doc
  //   survives untouched. That's what makes it safe around server-critical
  //   fields the client must never round-trip (e.g. event-registrations'
  //   lastNameLower, the paged Attendees table's sort key).
  // - Values may be FieldValue sentinels (arrayUnion/arrayRemove/increment);
  //   keys may be dot-paths into nested MAPS - but NOT into array elements
  //   (Firestore has no array-index addressing; for embedded-array cases see
  //   EventService.mutateAgendaItem()).
  // - REJECTS if the doc doesn't exist (updateDoc semantics - unlike setDoc,
  //   which would create it); callers must hold a real id.
  // - Returns void ON PURPOSE: no fromFirestore re-read, and never pass a
  //   whole model object here - that writes a stray `id` field and
  //   Date-converted copies of every field, the exact legacy failure mode
  //   the old registerForTrainingSession() had.
  // - Firestore rejects `undefined` values - build keys conditionally, same
  //   house rule as everywhere else (see CLAUDE.md's write gotcha).
  public updateFields(id: string, table: string, partial: Record<string, unknown>): Promise<void> {
    return updateDoc(doc(this.fs, this.path(table) + '/' + id), partial as UpdateData<DocumentData>);
  }

  public delete(id: string, table: string){
    return deleteDoc(doc(this.fs, this.path(table) + '/' + id));
  }

  // ---- Atomic multi-document writes ----
  //
  // For the cases where two documents in DIFFERENT collections have to move
  // together or not at all. Campaign activation is the first: it flips a
  // campaign to live and its published offer to active, and a half-applied
  // pair means a campaign advertising a discount that never started (or a
  // live discount on a campaign that is still a draft).
  //
  // Deliberately thin - the caller composes the batch and commits it, the
  // same shape as writeBatch itself, rather than this DAO growing a method
  // per combination of collections.
  public batch(): WriteBatch {
    return writeBatch(this.fs);
  }

  // Stages the same write updateFields() performs, onto a caller's batch.
  // Same rules apply: the doc must already exist, and no undefined values.
  public batchUpdateFields(
    batch: WriteBatch,
    id: string,
    table: string,
    partial: Record<string, unknown>
  ): void {
    batch.update(doc(this.fs, this.path(table) + '/' + id), partial as UpdateData<DocumentData>);
  }

  // ---- Live streams ------------------------------------------------------
  //
  // Every stream below catches a terminal error, logs it, invokes the
  // optional onError side-channel and falls back to emitting []. Without
  // that, a failed/offline/permission-denied listener just errors the
  // observable silently -- no error callback is registered at most call
  // sites, so the UI would be left showing stale/empty data forever with no
  // visible sign anything went wrong. onError lets callers that want to
  // distinguish "genuinely empty" from "failed to load" do so (see the
  // admin's FulfillmentComponent for the reference usage). IMPORTANT for
  // callers that do: once it fires, the returned Observable has already
  // fallen back to of([]), which completes - the live listener is gone, not
  // paused, so recovering means subscribing again fresh. Streams do NOT
  // retry: a jittered-retry layer existed briefly (2026-08-15) and was a
  // misdiagnosis; don't re-add it.

  public streamAll(table: string, fromFirestore?: FromFirestore<T>, limitCount?: number, onError?: (err: unknown) => void): Observable<T[]>{
    const constraints: QueryConstraint[] = limitCount ? [limit(limitCount)] : [];

    return collectionData(query(collection(this.fs, this.path(table)), ...constraints), {idField: 'id'}).pipe(
      map(docs => {
        return this.getDocListFromStream(docs, fromFirestore);
      }),
      catchError(err => {
        console.error(`FirebaseDAO.streamAll('${table}') failed:`, err);
        onError?.(err);
        return of([]);
      })
    );
  }

  // Live like streamAll(), but ordered server-side and meant to be paired
  // with a limitCount so "the N most recent docs" is what the listener
  // actually subscribes to, instead of the whole collection. A bare
  // orderBy + limit (no where clause) needs no composite index - Firestore's
  // automatic single-field indexes cover it. Docs missing orderByField
  // entirely are excluded by Firestore's orderBy semantics - fine for a
  // required field like a created/submitted timestamp, not for optional ones.
  public streamAllOrdered(table: string, orderByField: string, orderDirection: OrderByDirection = 'desc', fromFirestore?: FromFirestore<T>, limitCount?: number, onError?: (err: unknown) => void): Observable<T[]>{
    const constraints: QueryConstraint[] = [orderBy(orderByField, orderDirection)];
    if (limitCount) constraints.push(limit(limitCount));

    return collectionData(query(collection(this.fs, this.path(table)), ...constraints), {idField: 'id'}).pipe(
      map(docs => {
        return this.getDocListFromStream(docs, fromFirestore);
      }),
      catchError(err => {
        console.error(`FirebaseDAO.streamAllOrdered('${table}', '${orderByField}') failed:`, err);
        onError?.(err);
        return of([]);
      })
    );
  }

  public streamByValue(table: string, field: string, value: unknown, fromFirestore?: FromFirestore<T>, limitCount?: number, onError?: (err: unknown) => void): Observable<T[]>{
    const constraints: QueryConstraint[] = [where(field, "==", value)];
    if (limitCount) constraints.push(limit(limitCount));

    return collectionData(query(collection(this.fs, this.path(table)), ...constraints), {idField: 'id'}).pipe(
      map(docs => {
        return this.getDocListFromStream(docs, fromFirestore);
      }),
      catchError(err => {
        console.error(`FirebaseDAO.streamByValue('${table}', '${field}') failed:`, err);
        onError?.(err);
        return of([]);
      })
    );
  }

  // streamByValue() with a server-side orderBy(orderField, 'desc') so the
  // newest documents survive the limit() cap (see getAllOrdered() above).
  // NOTE: where(field, '==', ...) combined with orderBy(orderField) on a
  // different field REQUIRES a composite index on the collection -- the
  // query hard-fails with failed-precondition until that index is READY
  // (declared in the admin repo's firestore.indexes.json, which owns index
  // deployment for this database).
  public streamByValueOrdered(table: string, field: string, value: unknown, orderField: string, fromFirestore?: FromFirestore<T>, limitCount?: number, onError?: (err: unknown) => void): Observable<T[]>{
    const constraints: QueryConstraint[] = [where(field, "==", value), orderBy(orderField, 'desc')];
    if (limitCount) constraints.push(limit(limitCount));

    return collectionData(query(collection(this.fs, this.path(table)), ...constraints), {idField: 'id'}).pipe(
      map(docs => {
        return this.getDocListFromStream(docs, fromFirestore);
      }),
      catchError(err => {
        console.error(`FirebaseDAO.streamByValueOrdered('${table}', '${field}', '${orderField}') failed:`, err);
        onError?.(err);
        return of([]);
      })
    );
  }

  public queryStreamByValue(table: string, field: string, opStr: WhereFilterOperandKeys, value: unknown, fromFirestore?: FromFirestore<T>, limitCount?: number, onError?: (err: unknown) => void): Observable<T[]>{
    const constraints: QueryConstraint[] = [where(field, opStr, value)];
    if (limitCount) constraints.push(limit(limitCount));

    return collectionData(query(collection(this.fs, this.path(table)), ...constraints), {idField: 'id'}).pipe(
      map(docs => {
        return this.getDocListFromStream(docs, fromFirestore);
      }),
      catchError(err => {
        console.error(`FirebaseDAO.queryStreamByValue('${table}', '${field}') failed:`, err);
        onError?.(err);
        return of([]);
      })
    );
  }

  // Observable, single-document counterpart to streamByValue() above.
  // Querying a collection by an 'id' field via streamByValue() briefly emits
  // an empty array before the real snapshot arrives (and permanently emits
  // one for a bad/deleted id), which is a real latent crash source for any
  // caller that assumes element 0 exists as soon as the stream fires.
  // Reading the document directly by id doesn't have that gap.
  public streamByDocId(id: string, table: string, fromFirestore?: FromFirestore<T>): Observable<T[]>{
    return docData(doc(this.fs, this.path(table) + '/' + id), {idField: 'id'}).pipe(
      map(data => {
        if (!data) return [];
        const val = data as T;
        return [fromFirestore ? fromFirestore(val) : val];
      }),
      catchError(err => {
        console.error(`FirebaseDAO.streamByDocId('${table}', '${id}') failed:`, err);
        return of([]);
      })
    );
  }

  // Callback-style single-document listener (the admin's older idiom - see
  // BaseService.streamRecord). Prefer streamByDocId() in new code.
  public streamById(id: string, table: string, callBack: (value: T) => void, fromFirestore?: FromFirestore<T>): Unsubscribe{
    return onSnapshot(doc(this.fs, this.path(table) + '/' + id), async doc => {
      if(doc.exists()){
        let retval: T = doc.data() as T;
        retval.id = doc.id;
        retval = fromFirestore? fromFirestore(retval) : retval;
        callBack(retval);
      }
    })
  }

  private getDocListFromStream(docs: (DocumentData | (DocumentData & {id: string}))[], fromFirestore?: FromFirestore<T>){
    const retval: T[] = [];

    docs.forEach(doc => {
      const val: T = doc as T;
      val.id = doc.id;
      retval.push(fromFirestore? fromFirestore(val) :val);
    })

    return retval;
  }

  private getDocListFromPromise(docs: QuerySnapshot<DocumentData, DocumentData>, fromFirestore?: FromFirestore<T>){
    const retval: T[] = [];

    docs.forEach(doc => {
      const val: T = doc.data() as T;
      val.id = doc.id;
      retval.push(fromFirestore? fromFirestore(val) :val);
    })

    return retval;
  }

}

export enum WhereFilterOperandKeys {
  less = '<',
  lessOrEqual = '<=',
  equal = '==',
  notEqual = '!=',
  more = '>',
  moreOrEqual = '>=',
  arrayContains = 'array-contains',
  in = 'in',
  arrayContainsAny = 'array-contains-any',
  notIn = 'not-in',
}

export class QueryParam {
  constructor(field: string, operation: WhereFilterOperandKeys, value: unknown) {
    this.field = field;
    this.operation = operation;
    this.value = value;
  }
  field: string;
  value: unknown;
  operation: WhereFilterOperandKeys;
}
