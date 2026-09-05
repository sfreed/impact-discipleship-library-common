import { Injectable } from '@angular/core';
import { FirebaseDAO } from '../firebase.dao';
import { FormDefinitionModel } from '../../models/domain/form-definition.model';
import { dateFromTimestamp } from '../../utils/date-from-timestamp';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root'
})
export class FormDefinitionService extends BaseService<FormDefinitionModel> {
  constructor(public override dao: FirebaseDAO<FormDefinitionModel>) {
    super(dao);
    this.table = 'forms';
    this.fromFirestore = FormDefinitionService.fromFirestore;
  }

  static readonly fromFirestore = (data: FormDefinitionModel): FormDefinitionModel => {
    data.createdAt = dateFromTimestamp(data.createdAt);
    data.updatedAt = dateFromTimestamp(data.updatedAt);
    return data;
  };
}
