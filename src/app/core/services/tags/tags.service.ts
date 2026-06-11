import { addTag } from './ngrx/tags.actions';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../api/api.service';
import { HttpParams } from '@angular/common/http';
@Injectable({
  providedIn: 'root',
})
export class TagsService {
  private url = `v1/tags/`;
  constructor(private apiService: ApiService) {}
   
  getTags(page: number, limit: number, searchTerm?: string): Observable<any> {

    let params = new HttpParams().set('page', page).set('limit', limit).set('query', searchTerm || '');
    return this.apiService.get(this.url, { params });
  }

  deleteTag(name: string): Observable<any> {
    const params = new HttpParams().set('tag_name', name);
    return this.apiService.delete(this.url, { params });
  }

  addTag(tagName: string): Observable<any> {
    return this.apiService.post(this.url, { name: tagName });
  }

  editTag(tagName: string, newTagName: string): Observable<any> {
    return this.apiService.put(this.url, { new_tag_name: newTagName, tag_name: tagName });
  }
}
