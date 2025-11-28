    import { Injectable } from '@angular/core';
    import { HttpClient } from '@angular/common/http';
    import { Observable } from 'rxjs';
    import { LeaveRequest, CreateLeaveDto, UpdateLeaveStatusDto } from '../models/leave.model';

    @Injectable({
    providedIn: 'root'
    })
    export class LeaveService {
    private apiUrl = 'http://localhost:5195/api/LeaveRequests'; 

    constructor(private http: HttpClient) { }
    getMyLeaves(): Observable<LeaveRequest[]> {
        return this.http.get<LeaveRequest[]>(`${this.apiUrl}/my-leaves`);
    }
    createRequest(data: CreateLeaveDto): Observable<any> {
        return this.http.post(this.apiUrl, data);
    }
    getAllLeaves(): Observable<LeaveRequest[]> {
        return this.http.get<LeaveRequest[]>(`${this.apiUrl}/all`);
    }
    updateStatus(data: UpdateLeaveStatusDto): Observable<any> {
        return this.http.post(`${this.apiUrl}/update-status`, data);
    }
    deleteRequest(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
    }