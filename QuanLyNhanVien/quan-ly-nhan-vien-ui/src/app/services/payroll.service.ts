    import { Injectable } from '@angular/core';
    import { HttpClient } from '@angular/common/http';
    import { Observable } from 'rxjs';
    import { Payroll } from '../models/payroll.model';
    import { PayrollCalculationRequestDto } from '../models/payroll-calculation-request.dto';

    @Injectable({
    providedIn: 'root'
    })
    export class PayrollService {
    private apiUrl = 'http://localhost:8080/api/Payroll';

    constructor(private http: HttpClient) { }
    calculatePayroll(requestDto: PayrollCalculationRequestDto): Observable<any> {
        return this.http.post(`${this.apiUrl}/calculate`, requestDto);
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
        return this.http.get(`${this.apiUrl}/export?month=${month}&year=${year}`, { responseType: 'blob' });
    }
    updatePayrollDetails(id: number, details: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/details`, details);
  }
}