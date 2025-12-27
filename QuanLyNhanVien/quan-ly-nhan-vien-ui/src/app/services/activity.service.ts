import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SystemActivity } from '../models/system-activity.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private apiUrl = 'http://localhost:8080/api/Activities';

  constructor(private http: HttpClient) {}

  getActivities(page: number, pageSize: number, search: string = ''): Observable<{ total: number, data: SystemActivity[] }> {
    return this.http.get<{ total: number, data: SystemActivity[] }>(
      `${this.apiUrl}?page=${page}&pageSize=${pageSize}&search=${search}`
    );
  }
}