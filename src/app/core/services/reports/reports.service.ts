import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../api/api.service';
import {
  ReportPeriodParams,
  ApiResponse,
  OverviewReport,
  MessagesByType,
  MessagesGraphResponse,
  TicketsStatusOverTimeResponse,
  TicketsTotalByStatus,
  OperatorsPerformanceResponse,
  TagsAnalyticsResponse,
} from '../../models/reports.model';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  constructor(private apiService: ApiService) {}

  getOverviewReport(params: ReportPeriodParams): Observable<ApiResponse<OverviewReport>> {
    const httpParams = this.buildHttpParams(params);
    return this.apiService.get<ApiResponse<OverviewReport>>('v1/reports/overview', { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Get overview report error:', error);
        throw error;
      })
    );
  }

  getMessagesByType(params: ReportPeriodParams): Observable<ApiResponse<MessagesByType>> {
    const httpParams = this.buildHttpParams(params);
    return this.apiService.get<ApiResponse<MessagesByType>>('v1/reports/messages/by-type', { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Get messages by type error:', error);
        throw error;
      })
    );
  }

  getMessagesGraph(params: ReportPeriodParams): Observable<ApiResponse<MessagesGraphResponse>> {
    const httpParams = this.buildHttpParams(params);
    return this.apiService.get<ApiResponse<MessagesGraphResponse>>('v1/reports/messages/graph', { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Get messages graph error:', error);
        throw error;
      })
    );
  }

  getTicketsStatusOverTime(params: ReportPeriodParams): Observable<ApiResponse<TicketsStatusOverTimeResponse>> {
    const httpParams = this.buildHttpParams(params);
    return this.apiService.get<ApiResponse<TicketsStatusOverTimeResponse>>('v1/reports/tickets/status-over-time', { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Get tickets status over time error:', error);
        throw error;
      })
    );
  }

  getTicketsTotalByStatus(params: ReportPeriodParams): Observable<ApiResponse<TicketsTotalByStatus>> {
    const httpParams = this.buildHttpParams(params);
    return this.apiService.get<ApiResponse<TicketsTotalByStatus>>('v1/reports/tickets/total-by-status', { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Get tickets total by status error:', error);
        throw error;
      })
    );
  }

  getOperatorsPerformance(params: ReportPeriodParams): Observable<ApiResponse<OperatorsPerformanceResponse>> {
    const httpParams = this.buildHttpParams(params);
    return this.apiService.get<ApiResponse<OperatorsPerformanceResponse>>('v1/reports/operators/performance', { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Get operators performance error:', error);
        throw error;
      })
    );
  }

  getTagsAnalytics(params: ReportPeriodParams): Observable<ApiResponse<TagsAnalyticsResponse>> {
    const httpParams = this.buildHttpParams(params);
    return this.apiService.get<ApiResponse<TagsAnalyticsResponse>>('v1/reports/tags/analytics', { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Get tags analytics error:', error);
        throw error;
      })
    );
  }

  exportReport(params: ReportPeriodParams): Observable<Blob> {
    let httpParams = new HttpParams().set('period_type', params.period_type);

    if (params.start_date) {
      httpParams = httpParams.set('start_date', params.start_date);
    }

    if (params.end_date) {
      httpParams = httpParams.set('end_date', params.end_date);
    }

    return this.apiService.getBlob('v1/reports/export', { params: httpParams });
  }

  private buildHttpParams(params: ReportPeriodParams): HttpParams {
    let httpParams = new HttpParams().set('period_type', params.period_type);
    
    if (params.start_date) {
      httpParams = httpParams.set('start_date', params.start_date);
    }
    
    if (params.end_date) {
      httpParams = httpParams.set('end_date', params.end_date);
    }
    
    return httpParams;
  }
}

