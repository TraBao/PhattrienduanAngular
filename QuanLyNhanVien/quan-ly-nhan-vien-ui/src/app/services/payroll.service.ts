    import { Injectable } from '@angular/core';
    import { HttpClient } from '@angular/common/http';
    import { Observable } from 'rxjs';
    import { Payroll } from '../models/payroll.model';

    @Injectable({
    providedIn: 'root'
    })
    export class PayrollService {
    private apiUrl = 'http://localhost:5195/api/Payroll';

    constructor(private http: HttpClient) { }

    calculatePayroll(month: number, year: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/calculate?month=${month}&year=${year}`, {});
    }
    getMonthlyPayroll(month: number, year: number): Observable<Payroll[]> {
        return this.http.get<Payroll[]>(`${this.apiUrl}/monthly?month=${month}&year=${year}`);
    }
    markAsPaid(id: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/mark-paid/${id}`, {});
    }
    getMyPayslips(): Observable<Payroll[]> {
        return this.http.get<Payroll[]>(`${this.apiUrl}/my-payslips`);
    }
    exportPayroll(month: number, year: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export?month=${month}&year=${year}`, {
        responseType: 'blob'
    });
    }
}
