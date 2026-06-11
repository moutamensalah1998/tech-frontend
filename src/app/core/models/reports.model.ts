// Period types
export type PeriodType = 'today' | 'yesterday' | 'last_7_days' | 'last_month' | 'custom';

// Request parameters
export interface ReportPeriodParams {
  period_type: PeriodType;
  start_date?: string | null;
  end_date?: string | null;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  status_code: number;
  data: T;
}

// Overview Report
export interface OverviewReport {
  open_tickets: number;
  pending_tickets: number;
  solved_tickets: number;
  missed_chats: number;
}

// Messages by Type
export interface MessagesByType {
  authentication: number;
  marketing: number;
  utility: number;
}

// Messages Graph Data
export interface MessagesGraphDataPoint {
  date: string;
  sent: number;
  failed: number;
  read: number;
  unread: number;
}

export interface MessagesGraphResponse {
  data: MessagesGraphDataPoint[];
}

// Tickets Status Over Time
export interface TicketsStatusOverTimeDataPoint {
  date: string;
  open: number;
  pending: number;
  solved: number;
  expired: number;
}

export interface TicketsStatusOverTimeResponse {
  data: TicketsStatusOverTimeDataPoint[];
}

// Tickets Total by Status
export interface TicketsTotalByStatus {
  open: number;
  pending: number;
  solved: number;
  expired: number;
}

// Operators Performance
export interface OperatorPerformance {
  user_id: string;
  user_name: string;
  current_open_tickets: number;
  current_pending_tickets: number;
  tickets_solved: number;
  missed_chats: number;
}

export interface OperatorsPerformanceResponse {
  operators: OperatorPerformance[];
}

// Tags Analytics
export interface TagAnalytics {
  tag_name: string;
  count: number;
}

export interface TagsAnalyticsResponse {
  tags: TagAnalytics[];
}

