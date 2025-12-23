    import { Injectable } from '@angular/core';
    import { HttpClient } from '@angular/common/http';
    import { Observable } from 'rxjs';
    import { LeaveRequest, CreateLeaveDto, UpdateLeaveStatusDto } from '../models/leave.model';

    @Injectable({
    providedIn: 'root'
    })
    export class LeaveService {
    private apiUrl = 'http://localhost:8080/api/LeaveRequests';

    constructor(private http: HttpClient) { }
    getMyLeaves(): Observable<LeaveRequest[]> {
        return this.http.get<LeaveRequest[]>(`${this.apiUrl}/my-leaves`);
    }
    getAllLeaves(status: string = '', page: number = 1, pageSize: number = 10): Observable<any> {
        return this.http.get(`${this.apiUrl}/all?status=${status}&page=${page}&pageSize=${pageSize}`);
    }

    createRequest(data: any): Observable<any> {
        return this.http.post(this.apiUrl, data);
    }

    updateStatus(data: { requestId: number, status: string, adminComment: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/update-status`, data);
    }

    deleteRequest(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
    }