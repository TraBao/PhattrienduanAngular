import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Meeting } from '../models/meeting.model';

@Injectable({
  providedIn: 'root'
})
export class MeetingService {
  private apiUrl = 'http://localhost:8080/api/Meetings';

  constructor(private http: HttpClient) { }

  getMeetings(): Observable<Meeting[]> {
    return this.http.get<Meeting[]>(this.apiUrl);
  }

  createMeeting(title: string): Observable<Meeting> {
    return this.http.post<Meeting>(this.apiUrl, { title });
  }

  endMeeting(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}