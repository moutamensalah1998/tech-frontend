import { Injectable } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { Observable } from 'rxjs';
import {
  InvitationListResponse,
  InvitationCreateResponse,
  InvitationValidateResponse,
  RegisterWithInvitationResponse,
  RegisterEmbeddedSignupResponse,
} from '../../models/invitation.model';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  constructor(private apiService: ApiService) {}

  /** Create a new invitation (platform owner only) */
  createInvitation(
    email?: string,
    company_name?: string,
    expires_in_days: number = 30
  ): Observable<InvitationCreateResponse> {
    let params = `expires_in_days=${expires_in_days}`;
    if (email) params += `&email=${encodeURIComponent(email)}`;
    if (company_name) params += `&company_name=${encodeURIComponent(company_name)}`;
    return this.apiService.post<InvitationCreateResponse>(
      `/v1/invitations/create?${params}`,
      {},
      { isJson: true }
    );
  }

  /** List all invitations (platform owner only) */
  listInvitations(skip: number = 0, limit: number = 50): Observable<InvitationListResponse> {
    return this.apiService.get<InvitationListResponse>(
      `/v1/invitations?skip=${skip}&limit=${limit}`
    );
  }

  /** Disable an invitation (platform owner only) */
  disableInvitation(invitationId: string): Observable<any> {
    return this.apiService.put<any>(
      `/v1/invitations/${invitationId}/disable`,
      {},
      { isJson: true }
    );
  }

  /** Resend an invitation (platform owner only) */
  resendInvitation(invitationId: string, expires_in_days: number = 30): Observable<any> {
    return this.apiService.put<any>(
      `/v1/invitations/${invitationId}/resend?expires_in_days=${expires_in_days}`,
      {},
      { isJson: true }
    );
  }

  /** Validate an invitation token (public) */
  validateInvitation(token: string): Observable<InvitationValidateResponse> {
    return this.apiService.get<InvitationValidateResponse>(
      `/v1/invite/validate/${token}`
    );
  }

  /** Register with an invitation token (public) */
  registerWithInvitation(params: {
    token: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    company_name: string;
  }): Observable<RegisterWithInvitationResponse> {
    const queryParams = new URLSearchParams();
    queryParams.set('token', params.token);
    queryParams.set('first_name', params.first_name);
    queryParams.set('last_name', params.last_name);
    queryParams.set('email', params.email);
    queryParams.set('password', params.password);
    queryParams.set('company_name', params.company_name);
    return this.apiService.post<RegisterWithInvitationResponse>(
      `/v1/invite/register?${queryParams.toString()}`,
      {},
      { isJson: true }
    );
  }

  /**
   * Register via invitation token + Meta Embedded Signup code.
   * The backend handles Meta OAuth exchange, WABA setup, account creation
   * and returns an auth token for immediate login.
   */
  registerWithEmbeddedSignup(params: {
    token: string;
    meta_code: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    company_name: string;
  }): Observable<RegisterEmbeddedSignupResponse> {
    const queryParams = new URLSearchParams();
    queryParams.set('token', params.token);
    queryParams.set('meta_code', params.meta_code);
    queryParams.set('first_name', params.first_name);
    queryParams.set('last_name', params.last_name);
    queryParams.set('email', params.email);
    queryParams.set('password', params.password);
    queryParams.set('company_name', params.company_name);
    return this.apiService.post<RegisterEmbeddedSignupResponse>(
      `/v1/invite/register-embedded?${queryParams.toString()}`,
      {},
      { isJson: true }
    );
  }
}
