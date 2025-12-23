    import { Injectable } from '@angular/core';
    import { HttpClient } from '@angular/common/http';
    import { Observable } from 'rxjs';
    import { Attendance } from '../models/attendance.model';

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
     * @param note
     */
    checkIn(note: string | null = null): Observable<any> {
        const body = { note: note };
        return this.http.post(`${this.apiUrl}/check-in`, body);
    }
    checkOut(): Observable<any> {
        return this.http.post(`${this.apiUrl}/check-out`, {});
    }
    getMyHistory(): Observable<Attendance[]> {
        return this.http.get<Attendance[]>(`${this.apiUrl}/my-history`);
    }
    }