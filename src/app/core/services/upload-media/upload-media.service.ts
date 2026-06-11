import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../api/api.service';
@Injectable({
  providedIn: 'root',
})
export class UploadMediaService {
  private base_url = `v1/media/`;
  constructor(private apiService: ApiService) {}

  uploadMedia(file: FormData): Observable<any> {
    const url = `${this.base_url}upload-media`;
    return this.apiService.post<any>(url, file, { isMultipart: true });
  }
}
