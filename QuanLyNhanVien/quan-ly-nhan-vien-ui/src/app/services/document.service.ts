    import { Injectable } from '@angular/core';
    import { HttpClient } from '@angular/common/http';
    import { Observable } from 'rxjs';
    import { EmployeeDocument } from '../models/document.model';

    @Injectable({
    providedIn: 'root'
    })
    export class DocumentService {
    private apiUrl = 'http://localhost:5195/api/Documents';

    constructor(private http: HttpClient) { }
    getDocuments(employeeId: number): Observable<EmployeeDocument[]> {
        return this.http.get<EmployeeDocument[]>(`${this.apiUrl}/employee/${employeeId}`);
    }
    uploadFile(employeeId: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post(`${this.apiUrl}/upload/${employeeId}`, formData);
    }
    downloadFile(id: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/download/${id}`, { responseType: 'blob' });
    }
    deleteFile(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
    }