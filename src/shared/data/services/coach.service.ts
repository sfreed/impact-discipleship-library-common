import { Injectable } from '@angular/core';
import { collection, documentId, getDocs, query, where } from '@angular/fire/firestore';
import { FirebaseDAO } from '../firebase.dao';
import { CoachModel } from '../../models/domain/coach.model';
import { tenantPath } from '../../lists/tenancy';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root'
})
export class CoachService extends BaseService<CoachModel>{
  constructor(public override dao: FirebaseDAO<CoachModel> ) {
    super(dao)
    this.table="coaches"
    this.fromFirestore = CoachService.fromFirestore
  }

  static readonly fromFirestore = (data: CoachModel): CoachModel => {
    data.fullname = data.firstName + " " + data.lastName

    return data;
  };

  // Fetches multiple coaches by ID in batched `in` queries instead of one
  // getById() Firestore read per coach (was an N+1 read pattern -- see
  // summit.component.ts/summit-preview.component.ts, where N is the number
  // of distinct coaches across a summit's agenda). Firestore's `in`
  // operator is capped at 10 comparison values per query, so ids are
  // chunked and the chunk queries run in parallel.
  //
  // The path goes through tenantPath (2026-09-05). It was `'/' + this.table`
  // - the database ROOT - which the tenancy guard could not see because it
  // is not a string literal, so after the 2026-09-02 cutover moved `coaches`
  // under tenants/ this read an empty collection and every summit preview
  // lost its coach names, silently.
  async getAllByIds(ids: string[]): Promise<CoachModel[]> {
    const uniqueIds = Array.from(new Set(ids)).filter(Boolean);

    if (uniqueIds.length === 0) return [];

    const chunkSize = 10;
    const chunks: string[][] = [];

    for (let i = 0; i < uniqueIds.length; i += chunkSize) {
      chunks.push(uniqueIds.slice(i, i + chunkSize));
    }

    const snapshots = await Promise.all(chunks.map(chunk =>
      getDocs(query(collection(this.dao.fs, '/' + tenantPath(this.table)), where(documentId(), 'in', chunk)))
    ));

    return snapshots.flatMap(snapshot =>
      snapshot.docs.map(doc => {
        const data = { ...doc.data(), id: doc.id } as CoachModel;
        return this.fromFirestore ? this.fromFirestore(data) : data;
      })
    );
  }
}
