// src/app/core/services/user-management/user-management.service.ts
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../api/api.service';
import {
  CreateUserModel,
  EditUserModel,
  GetRolesResponse,
  GetTeamsResponse,
  GetUsersResponse,
  TeamUpdateModel
} from '../../models/user-management.model';

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private readonly basePath = 'v1/user';
  private readonly teamBasePath = 'v1/team';

  constructor(private api: ApiService) { }

  getUsers(query: string | null, page: number, limit: number, sort?: string | null): Observable<GetUsersResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    // only set query if it has a non-empty value
    if (query && query.trim() !== '') {
      params = params.set('query', query.trim());
    }

    if (sort && sort.trim() !== '') {
      params = params.set('sort_by', sort.trim());
    }

    return this.api.get<GetUsersResponse>(`${this.basePath}/client`, { params });
  }

  createUser(user: CreateUserModel): Observable<void> {
    return this.api.post(`${this.basePath}/`, user);
  }

  updateUser(userId: string, user: EditUserModel): Observable<void> {
    return this.api.put(`${this.basePath}/${userId}`, user);
  }

  deleteUser(userId: string): Observable<void> {
    return this.api.delete(`${this.basePath}/${userId}`);
  }

  createTeam(teamName: string): Observable<void> {
    return this.api.post(`${this.teamBasePath}/`, { team_name: teamName });
  }

  getTeams(query: string | null, page: number, limit: number, sort?: string | null): Observable<GetTeamsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (query && query.trim() !== '') {
      params = params.set('query', query.trim());
    } else {
      params = params.set('query', '');
    }

    if (sort && sort.trim() !== '') {
      params = params.set('sort_by', sort.trim());
    }

    return this.api.get<GetTeamsResponse>(`${this.teamBasePath}/`, { params });
  }

  updateTeam(teamId: string, team: TeamUpdateModel): Observable<void> {
    return this.api.put(`${this.teamBasePath}/${teamId}`, team);
  }

  deleteTeam(teamName: string): Observable<void> {
    const params = new HttpParams().set('team_name', teamName);
    return this.api.delete(`${this.teamBasePath}/`, { params });
  }

  getRoles(): Observable<GetRolesResponse> {
    return this.api.get<GetRolesResponse>('v1/auth/roles');
  }

  forceResetPassword(userId: string, newPassword: string): Observable<void> {
    return this.api.put(`v1/auth/force-password-reset/${userId}`, { new_password: newPassword });
  }

  forceLogout(userId: string): Observable<void> {
    return this.api.post(`v1/auth/force-logout/${userId}`, {});
  }

  // Reset Password
  sendResetEmail(email: string): Observable<any> {
    return this.api.post(`v1/auth/forget-password`, { email });
  }

  verifyResetCode(email: string, code: string): Observable<{ resetToken?: string; message?: string }> {
    return this.api.post<{ resetToken?: string; message?: string }>(`v1/auth/verify-otp`, { email, otp_code: code });
  }

  resetPassword(email: string, newPassword: string, otpCode: string): Observable<any> {
    return this.api.post(`v1/auth/reset-password`, {
      email,
      new_password: newPassword,
      confirm_password: newPassword,
      otp_code: otpCode
    });
  }

}
