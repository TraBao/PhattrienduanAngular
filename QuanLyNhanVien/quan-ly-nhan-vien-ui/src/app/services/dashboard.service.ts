import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable({
providedIn: 'root'
})
export class DashboardService {
    private apiUrl = 'http://localhost:8080/api/Dashboard';

    constructor(private http: HttpClient) { }

    getStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/stats`);
    }

    getSalaryGrowth(year: number): Observable<number[]> {
        return this.http.get<number[]>(`${this.apiUrl}/salary-growth/${year}`);
    }

    getDailyCheckIns(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/daily-check-ins`).pipe(
            catchError(error => {
                console.error('Lỗi khi lấy dữ liệu chấm công hàng ngày:', error);
                return of([]);
            })
        );
    }
}