import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileSettingsService {
  constructor(private apiService: ApiService) {}

  getBusinessProfile(): Observable<any> {
    return this.apiService.get(`v1/business-profile`);
  }

  updateBusinessProfile(profileData: FormData): Observable<any> {
    return this.apiService.put(`v1/business-profile`, profileData, { isMultipart: true });
  }

  updateUserProfile(userId: string, userData: any): Observable<any> {
    return this.apiService.put(`v1/user/${userId}`, userData);
  }
  
}
