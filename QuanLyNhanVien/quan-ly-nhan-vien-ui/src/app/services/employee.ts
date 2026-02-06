import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, finalize, throwError, map } from 'rxjs';
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

  private employeesSubject = new BehaviorSubject<Employee[]>([]);
  public employees$ = this.employeesSubject.asObservable();

  private totalItemsSubject = new BehaviorSubject<number>(0);
  public totalItems$ = this.totalItemsSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) { }

  getEmployees(search: string = '', page: number = 1, pageSize: number = 10): void {
    this.isLoadingSubject.next(true);
    let params = new HttpParams()
      .set('search', search)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    this.http.get<PaginatedEmployees>(this.apiUrl, { params }).pipe(
        finalize(() => this.isLoadingSubject.next(false))
    ).subscribe({
        next: (response) => {
            const mappedData = response.data.map((item: any) => {
                if (item.employee) {
                    return { ...item.employee, isLocked: item.isLocked, userId: item.userId } as Employee;
                } else {
                    return item as Employee;
                }
            });
            this.employeesSubject.next(mappedData);
            this.totalItemsSubject.next(response.totalItems);
        },
        error: (err) => {
            console.error('Lỗi khi tải nhân viên:', err);
            this.employeesSubject.next([]);
            this.totalItemsSubject.next(0);
        }
    });
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
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentEmployees = this.employeesSubject.getValue();
        const updatedEmployees = currentEmployees.filter(emp => emp.id !== id);
        this.employeesSubject.next(updatedEmployees);
        this.totalItemsSubject.next(this.totalItemsSubject.getValue() - 1);
      })
    );
  }
  /**
   * 
   * @param id
   * @param workMode
   */
  updateWorkMode(id: number, workMode: string): Observable<any> {
    const url = `${this.apiUrl}/${id}/workmode`;
    const body = { workMode: workMode };
    return this.http.put(url, body);
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
  getAllEmployeesForSelection(): Observable<Employee[]> {
    const params = new HttpParams().set('page', '1').set('pageSize', '1000');
    return this.http.get<PaginatedEmployees>(this.apiUrl, { params }).pipe(
      map(response => {
        if (!response || !Array.isArray(response.data)) {
          console.warn('API getAllEmployeesForSelection không trả về dữ liệu hợp lệ.');
          return [];
        }

        return response.data.map((item: any) => {
          const employeeData = item.employee || item;
          return {
            ...employeeData,
            isLocked: item.isLocked,
            userId: item.userId
          } as Employee;
        });
      })
    );
  }
}