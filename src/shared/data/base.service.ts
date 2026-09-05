import { Injectable } from '@angular/core';
import { DocumentData, OrderByDirection, QueryDocumentSnapshot, Unsubscribe } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { BaseModel } from '../models/base.model';
import { FirebaseDAO, FromFirestore, PagedResult, QueryParam, WhereFilterOperandKeys } from './firebase.dao';

// The pass-through every record service in the web site and the admin app
// extends: forward each call to the DAO with THIS service's own `table`
// and `fromFirestore` attached. Shared by both apps since 2026-09-05
// (review item 9) - see firebase.dao.ts's header. A subclass sets `table`
// (the Firestore collection name, resolved through tenantPath by the DAO)
// and optionally `fromFirestore` (a deserialization hook, typically
// Timestamp -> Date).
@Injectable({
  providedIn: 'root'
})
export class BaseService<T extends BaseModel> {
  public table = '';
  public fromFirestore?: FromFirestore<T>;

  constructor(public dao: FirebaseDAO<T>) {}

  // limitCount is optional everywhere below and defaults to unbounded
  // (existing behavior) -- pass it from a page/component to cap how many
  // documents a list/stream query pulls back instead of the whole collection.
  getAll(limitCount?: number): Promise<T[]>{
    return this.dao.getAll(this.table, this.fromFirestore, limitCount);
  }

  // getAll() ordered newest-first on orderField (server-side orderBy desc)
  // so a limitCount cap keeps the newest documents, not doc-id order.
  getAllOrdered(orderField: string, limitCount?: number): Promise<T[]>{
    return this.dao.getAllOrdered(this.table, orderField, this.fromFirestore, limitCount);
  }

  getAllByValue(field: string, value: unknown, limitCount?: number): Promise<T[]>{
    return this.dao.getAllByValue(this.table, field, value, this.fromFirestore, limitCount);
  }

  queryAllByMultiValue(queries: QueryParam[], limitCount?: number): Promise<T[]>{
    return this.dao.queryAllByMultiValue(this.table, queries, this.fromFirestore, limitCount)
  }

  // Undefined when there is no such document - see FirebaseDAO.getById().
  getById(id: string): Promise<T | undefined>{
    return this.dao.getById(id, this.table, this.fromFirestore);
  }

  // See FirebaseDAO.getPage()'s comment - one-time paged fetch, not a live
  // subscription, for list screens backed by PagedCollectionSource instead
  // of streamAll().
  getPage(pageSize: number, cursor: QueryDocumentSnapshot<DocumentData> | null, orderByField: string, orderDirection: OrderByDirection = 'asc', filters?: QueryParam[]): Promise<PagedResult<T>>{
    return this.dao.getPage(this.table, pageSize, cursor, orderByField, orderDirection, filters, this.fromFirestore);
  }

  // onError - see FirebaseDAO's stream comment.
  streamAll(limitCount?: number, onError?: (err: unknown) => void): Observable<T[]>{
    return this.dao.streamAll(this.table, this.fromFirestore, limitCount, onError)
  }

  // Live like streamAll(), but ordered + capped server-side - see
  // FirebaseDAO.streamAllOrdered()'s comment (no composite index needed,
  // docs missing orderByField are excluded).
  streamAllOrdered(orderByField: string, orderDirection: OrderByDirection = 'desc', limitCount?: number, onError?: (err: unknown) => void): Observable<T[]>{
    return this.dao.streamAllOrdered(this.table, orderByField, orderDirection, this.fromFirestore, limitCount, onError);
  }

  streamAllByValue(field: string, value: unknown, limitCount?: number, onError?: (err: unknown) => void): Observable<T[]>{
    return this.dao.streamByValue(this.table, field, value, this.fromFirestore, limitCount, onError)
  }

  // streamAllByValue() ordered newest-first on orderField so a limitCount
  // cap keeps the newest documents. Requires a composite index on
  // (field ASC, orderField DESC) -- see FirebaseDAO.streamByValueOrdered().
  streamAllByValueOrdered(field: string, value: unknown, orderField: string, limitCount?: number, onError?: (err: unknown) => void): Observable<T[]>{
    return this.dao.streamByValueOrdered(this.table, field, value, orderField, this.fromFirestore, limitCount, onError)
  }

  // Observable single-document stream - streamByDocId(), not
  // streamByValue(this.table, 'id', id, ...), which briefly emits an empty
  // array before the real snapshot arrives (and permanently emits one for
  // a bad/deleted id) and crashed callers that assumed element 0 exists as
  // soon as the stream fires.
  streamById(id: string): Observable<T[]>{
    return this.dao.streamByDocId(id, this.table, this.fromFirestore);
  }

  // Callback-style single-document listener (the admin's older idiom).
  // Prefer streamById() in new code.
  streamRecord(id: string, callBack: (value: T) => void): Unsubscribe{
    return this.dao.streamById(id, this.table, callBack, this.fromFirestore);
  }

  queryStreamByValue(field: string, opStr: WhereFilterOperandKeys, value: unknown, limitCount?: number, onError?: (err: unknown) => void): Observable<T[]>{
    return this.dao.queryStreamByValue(this.table, field, opStr, value, this.fromFirestore, limitCount, onError);
  }

  add(value: T): Promise<T>{
    return this.dao.add(value, this.table, this.fromFirestore);
  }

  /** Create without the document coming back - see FirebaseDAO.create(). */
  create(value: T): Promise<string> {
    return this.dao.create(value, this.table);
  }

  update(id: string, value: T): Promise<T>{
    return this.dao.update(id, value, this.table, this.fromFirestore);
  }

  // See FirebaseDAO.updateFields()'s contract - PARTIAL update (only the
  // named fields change), FieldValue sentinels allowed, void return.
  updateFields(id: string, partial: Record<string, unknown>): Promise<void>{
    return this.dao.updateFields(id, this.table, partial);
  }

  delete(id: string){
    return this.dao.delete(id, this.table);
  }
}
