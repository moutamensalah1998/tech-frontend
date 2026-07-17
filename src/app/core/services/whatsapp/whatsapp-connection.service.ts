import { Injectable } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { environment } from '../../env/environment';
import { Observable } from 'rxjs';

export interface ExchangeTokenResponse {
  success: boolean;
  message?: string;
  waba_id?: string;
  phone_number_id?: string;
  business_phone_number?: string;
  business_name?: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WhatsAppConnectionService {
  private readonly configId = environment.meta.configId;

  constructor(private apiService: ApiService) {}

  getConfigId(): string {
    return this.configId;
  }

  /**
   * Exchange the authorization code with the backend.
   * The backend will handle token exchange with Meta and save
   * the WABA connection to the currently authenticated customer account.
   * 
   * @param code The authorization code from Meta Embedded Signup
   * @param clientId The current client's ID
   */
  exchangeToken(code: string, clientId: string): Observable<ExchangeTokenResponse> {
    const url = '/embedded-signup/exchange-token';
    const body = {
      code: code,
      client_id: clientId
    };
    return this.apiService.post<ExchangeTokenResponse>(url, body, { isJson: true });
  }
}