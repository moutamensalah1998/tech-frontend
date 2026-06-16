import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../api/api.service';
import { HttpParams } from '@angular/common/http';
import { ContactAttribute, ContactAttributesResponse } from '../../models/contact-attributes.model';

@Injectable({
  providedIn: 'root',
})
export class AttributesService {
  constructor(private apiService: ApiService) {}

  getAttributes(page: number, limit: number, searchTerm?: string):Observable<any>{
    const url = `v1/attributes/`;
    let params = new HttpParams().set('page', page).set('limit', limit).set('search', searchTerm || '');

    return this.apiService.get(url, { params });
  }

  deleteAttribute(name: string): Observable<any> {
    const params = new HttpParams().set('attribute_name', name);
    return this.apiService.delete(`v1/attributes/`, { params });
  }

  addAttribute(attributeName: string): Observable<any> {
    return this.apiService.post(`v1/attributes/`, { name: attributeName });
  }

  editAttribute(attributeName: string, newAttributeName: string): Observable<any> {
    return this.apiService.put(`v1/attributes/`, { attribute_name: attributeName, new_attribute_name: newAttributeName });
  }

  // New contact-specific attribute methods
  getAttributesByContactId(contactId: string, page: number = 1, limit: number = 10): Observable<ContactAttributesResponse> {
    const url = `v1/attributes/contact_id/${contactId}`;
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.apiService.get(url, { params });
  }

  addContactAttribute(contactId: string, attributeName: string, attributeValue: string): Observable<any> {
    const url = `v1/attributes/`;
    const payload = {
      name: attributeName,
      contact_id: contactId,
      value: attributeValue
    };
    return this.apiService.post(url, payload);
  }

    updateContactAttribute(contactId: string, attributeName: string, attributeValue: string): Observable<any> {
    const url = `v1/attributes/contact_id/${contactId}`;
    const params = new HttpParams()
      .set('attribute_name', attributeName)
      .set('attribute_value', attributeValue);
    return this.apiService.put(url, null, { params });
  }

  deleteContactAttribute(contactId: string, attributeName: string): Observable<any> {
    const url = `v1/attributes/contact_id/${contactId}`;
    const params = new HttpParams().set('attribute_name', attributeName);
    return this.apiService.delete(url, { params });
  }
}
