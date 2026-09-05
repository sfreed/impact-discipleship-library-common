import { Injectable } from '@angular/core';
import { FirebaseDAO } from '../firebase.dao';
import { TagModel } from '../../models/domain/tag.model';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root'
})
export class ProductCategoriesService extends BaseService<TagModel> {
  constructor(public override dao: FirebaseDAO<TagModel> ) {
    super(dao)
    this.table="product_categories"
  }
}
