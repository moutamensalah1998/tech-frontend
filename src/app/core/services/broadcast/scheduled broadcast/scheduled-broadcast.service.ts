import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from '../../../api/api.service';
import { BroadcastRequest, BroadcastResponse, ApiErrorResponse } from '../../../models/broadcast.model';

@Injectable({
  providedIn: 'root',
})
export class ScheduledBroadcastService {
  constructor(private apiService: ApiService) {}

  publishBroadcast(broadcastData: BroadcastRequest): Observable<any> {

    return this.apiService.post<any>('v1/broadcast/publish', broadcastData).pipe(

      catchError(error => {
        console.error('Publish broadcast error:', error);
        throw error;
      })
    );
  }

  getBroadcasts(params: { limit?: number; page?: number; search_name?: string; sort_by?: string }): Observable<BroadcastResponse> {

  let httpParams = new HttpParams();
  if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
  if (params.page) httpParams = httpParams.set('page', params.page.toString());
  if (params.search_name) httpParams = httpParams.set('search_name', params.search_name);
  if (params.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);

  return this.apiService.get<BroadcastResponse>('v1/broadcast/', { params: httpParams }).pipe(
    catchError(error => {
      console.error('Get broadcasts error:', error);
      throw error;
    })
  );
}


  deleteBroadcast(broadcast_id: string): Observable<any> {
    const params = new HttpParams().set('broadcast_id', broadcast_id);
    return this.apiService.delete<any>('v1/broadcast/', { params }).pipe(
      catchError(error => {
        console.error('Delete broadcast error:', error);
        throw error;
      })
    );
  }
} 