import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../api/api.service';
import { BroadcastStatsResponse } from '../../models/broadcast.model';

@Injectable({
  providedIn: 'root',
})
export class BroadcastStatsService {
  constructor(private apiService: ApiService) {}

  getBroadcastStats(broadcastId: string): Observable<BroadcastStatsResponse> {
    const params = new HttpParams().set('broadcast_id', broadcastId);
    return this.apiService.get<BroadcastStatsResponse>('v1/broadcast/stats', { params }).pipe(
      catchError(error => {
        console.error('Get broadcast stats error:', error);
        throw error;
      })
    );
  }
}