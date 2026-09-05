import { Injectable } from '@angular/core';
import { FirebaseDAO } from '../firebase.dao';
import { LocationModel } from '../../models/domain/location.model';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root'
})
export class LocationService extends BaseService<LocationModel>{
  constructor(public override dao: FirebaseDAO<LocationModel> ) {
    super(dao)
    this.table="locations"
  }

  // Per-id promise cache so a pipe rendering the same location id across
  // many event cards triggers one Firestore read, not one per card (the
  // web site's P10). Locations don't change within a visit; a failed read
  // is evicted so a transient error isn't cached permanently.
  private byIdCache = new Map<string, Promise<LocationModel | undefined>>();

  getByIdCached(id: string): Promise<LocationModel | undefined> {
    if (!id) {
      return Promise.resolve(undefined);
    }
    let cached = this.byIdCache.get(id);
    if (!cached) {
      cached = this.getById(id).catch((err) => {
        this.byIdCache.delete(id);
        throw err;
      });
      this.byIdCache.set(id, cached);
    }
    return cached;
  }
}
