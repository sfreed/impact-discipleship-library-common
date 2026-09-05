import { Injectable } from '@angular/core';
import { FirebaseDAO } from '../firebase.dao';
import { FormSubmissionModel } from '../../models/domain/form-submission.model';
import { dateFromTimestamp } from '../../utils/date-from-timestamp';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root'
})
export class FormSubmissionService extends BaseService<FormSubmissionModel> {
  constructor(public override dao: FirebaseDAO<FormSubmissionModel>) {
    super(dao);
    this.table = 'form_submissions';
    this.fromFirestore = FormSubmissionService.fromFirestore;
  }

  static readonly fromFirestore = (data: FormSubmissionModel): FormSubmissionModel => {
    data.submittedAt = dateFromTimestamp(data.submittedAt);
    if (data.routedAt) {
      data.routedAt = dateFromTimestamp(data.routedAt);
    }
    return data;
  };
}
