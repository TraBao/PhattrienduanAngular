import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from '../models/employee.model'; 
import { Department } from '../models/department.model';
export interface PaginatedEmployees {
  totalItems: number;
  data: Employee[];
  page: number;
  pageSize: number;
}

export type NewEmployee = Omit<Employee, 'id'>;

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly baseUrl = 'http://localhost:8080/api';
  private readonly apiUrl = `${this.baseUrl}/employees`;
  private readonly departmentApiUrl = `${this.baseUrl}/departments`;

  constructor(private http: HttpClient) { }

  /**
   * @param search
   * @param page
   * @param pageSize
   */
  getEmployees(search: string = '', page: number = 1, pageSize: number = 10): Observable<PaginatedEmployees> {
    let params = new HttpParams()
      .set('search', search)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PaginatedEmployees>(this.apiUrl, { params });
  }

  getEmployee(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  createEmployee(employeeData: NewEmployee): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, employeeData);
  }

  updateEmployee(employeeData: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${employeeData.id}`, employeeData); 
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.departmentApiUrl);
  }

  getMyProfile(): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/me`);
  }

  uploadAvatar(id: number, file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('employeeId', id.toString());
    return this.http.post<{ url: string }>(`${this.apiUrl}/upload-avatar`, formData);
  }
}