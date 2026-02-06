import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Attendance } from '../models/attendance.model';

export interface CheckInPayload {
  latitude?: number;
  longitude?: number;
  selfie?: File;
  note?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = 'http://localhost:8080/api/Attendance';

  constructor(private http: HttpClient) { }

  getTodayStatus(): Observable<Attendance | null> {
    return this.http.get<Attendance | null>(`${this.apiUrl}/today`);
  }
  /**
   * 
   * @param payload
   */
  checkIn(payload: CheckInPayload): Observable<any> {
    const formData = new FormData();

    if (payload.latitude) {
      formData.append('latitude', payload.latitude.toString());
    }
    if (payload.longitude) {
      formData.append('longitude', payload.longitude.toString());
    }
    if (payload.selfie) {
      formData.append('selfie', payload.selfie, 'selfie.jpg');
    }
    if (payload.note) {
      formData.append('note', payload.note);
    }

    return this.http.post(`${this.apiUrl}/check-in`, formData);
  }

  checkOut(): Observable<any> {
    return this.http.post(`${this.apiUrl}/check-out`, {});
  }
  
  getMyHistory(): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(`${this.apiUrl}/my-history`);
  }
}