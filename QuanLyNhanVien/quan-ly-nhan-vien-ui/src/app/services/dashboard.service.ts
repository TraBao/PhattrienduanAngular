    import { Injectable } from '@angular/core';
    import { HttpClient } from '@angular/common/http';
    import { Observable } from 'rxjs';

    @Injectable({
    providedIn: 'root'
    })
    export class DashboardService {
    private apiUrl = 'http://localhost:5195/api/Dashboard';

    constructor(private http: HttpClient) { }

    getStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/stats`);
    }
    getSalaryGrowth(year: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/salary-growth?year=${year}`);
}
}