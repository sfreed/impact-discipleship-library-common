import { Injectable } from '@angular/core';
import { FirebaseDAO } from '../firebase.dao';
import { SeriesModel } from '../../models/utils/series.model';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root'
})
export class SeriesService extends BaseService<SeriesModel>{
  constructor(public override dao: FirebaseDAO<SeriesModel>) {
    super(dao)
    this.table="series"
  }
}
