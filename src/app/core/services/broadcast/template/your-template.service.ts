import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../api/api.service';
import {
  TemplateApiResponse,
} from '../../../models/whatsapp-template.model';
import {
  CreateTemplateRequest,
  WhatsAppTemplateResponse,
  WorkingTemplateRequest,
} from '../../../models/whatsapp-yourtemplate.model';


@Injectable({
  providedIn: 'root',
})
export class YourTemplateService {
  constructor(private apiService: ApiService) { }

  getTemplates(
    page_number?: number,
    limit?: number,
    sort_by?: string,
    search_name?: string
  ): Observable<TemplateApiResponse> {
    let params = new HttpParams();

    if (page_number) params = params.set('page', page_number);
    if (limit) params = params.set('limit', limit);
    if (sort_by) params = params.set('sort_by', sort_by);
    if (search_name) params = params.set('search_name', search_name);

    return this.apiService.get<TemplateApiResponse>('v1/template/', {
      params,
    }).pipe(

      catchError(error => {
        console.error('API call failed:', error);
        throw error;
      })
    );
  }

  createTemplate(
    createTemplateRequest: CreateTemplateRequest
  ): Observable<WhatsAppTemplateResponse> {

    return this.apiService.post<WhatsAppTemplateResponse>(
      'v1/template/',
      createTemplateRequest
    ).pipe(
      catchError(error => {
        console.error('Template creation error:', error);
        throw error;
      })
    );
  }

  createTemplateWithWorkingStructure(
    workingTemplateRequest: WorkingTemplateRequest
  ): Observable<WhatsAppTemplateResponse> {

    return this.apiService.post<WhatsAppTemplateResponse>(
      'v1/template/',
      workingTemplateRequest
    ).pipe(
      catchError(error => {
        console.error('Template creation with working structure error:', error);
        throw error;
      })
    );
  }



  deleteTemplate(name: string, template_id?: string): Observable<any> {
    let params = new HttpParams();
    if (template_id) {
      params = params.set('template_id', template_id);
    }
    return this.apiService.delete<any>(`v1/template/${name}`, { params });
  }

  uploadMedia(file: FormData): Observable<any> {
    const token = file.get('token') as string;
    if (token) {
      file.delete('token');
    }
    return this.apiService.post<any>('v1/media/upload-template-media', file, { isMultipart: true }).pipe(
      catchError(error => {
        console.error('Template media upload error:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message,
          url: error.url
        });
        if (error.error) {
          console.error('Server error response:', JSON.stringify(error.error, null, 2));
        }
        throw error;
      })
    );
  }

  syncTemplates(): Observable<any> {
    return this.apiService.post<any>('v1/template/sync', {}).pipe(
      catchError(error => {
        console.error('Template sync error:', error);
        throw error;
      })
    );
  }
}
