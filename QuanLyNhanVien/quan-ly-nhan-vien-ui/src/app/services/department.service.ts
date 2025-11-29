import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Department } from '../models/department.model';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
    private apiUrl = 'http://localhost:5195/api/departments'; 

    constructor(private http: HttpClient) {}

    getAll(): Observable<Department[]> {
        return this.http.get<Department[]>(this.apiUrl);
    }

    create(data: Department): Observable<Department> {
        return this.http.post<Department>(this.apiUrl, data);
    }

    update(id: number, data: Department): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, data);
    }

    delete(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}