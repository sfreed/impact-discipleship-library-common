import { Injectable } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { FirebaseDAO } from '../firebase.dao';
import { DMMModel } from '../../models/domain/dmm.model';
import { dateFromTimestamp } from '../../utils/date-from-timestamp';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root'
})
export class DMMService extends BaseService<DMMModel>{
  constructor(public override dao: FirebaseDAO<DMMModel> ) {
    super(dao)
    this.table="dmms"
    this.fromFirestore = DMMService.fromFirestore
  }

  static readonly fromFirestore = (data: DMMModel): DMMModel => {
    data.date = dateFromTimestamp(data.date as Timestamp)

    return data;
  };
}
