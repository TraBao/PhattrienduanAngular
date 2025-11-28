import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from '../models/employee.model'; 
import { Department } from '../models/department.model';

export type NewEmployee = Omit<Employee, 'id'>;

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly apiUrl = 'http://localhost:5195/api/employees'; 
  private readonly departmentApiUrl = 'http://localhost:5195/api/departments'; 
  constructor(private http: HttpClient) { }

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl);
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
  return this.http.get<Employee>('http://localhost:5195/api/Employees/me');
  }
  uploadAvatar(id: number, file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('employeeId', id.toString());
    return this.http.post<{ url: string }>(`${this.apiUrl}/upload-avatar`, formData);
  }
}