import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmployeeService } from '../../services/employee';
import { Employee } from '../../models/employee.model';
import { MaterialModule } from '../../material-module';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { UserService } from '../../services/user.service';
import { Observable, Subscription, debounceTime } from 'rxjs';
import { AuthApiService } from '../../services/auth-api.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
      CommonModule, 
      MaterialModule, 
      RouterModule, 
      MatTooltipModule,
      ReactiveFormsModule
  ],
  templateUrl: './employee-list.html',
  styleUrls: ['./employee-list.scss']
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  isAdmin: boolean = false;
  canManage: boolean = false; 

  employees$: Observable<Employee[]>;
  totalItems$: Observable<number>;
  isLoading$: Observable<boolean>;
  
  pageSize = 12;
  currentPage = 1;
  searchControl = new FormControl('');
  private searchSubscription: Subscription | undefined;

  private baseUrl = 'http://localhost:8080';

  constructor(
    public employeeService: EmployeeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public userService: UserService,
    private authApiService: AuthApiService
  ) {
    this.employees$ = this.employeeService.employees$;
    this.totalItems$ = this.employeeService.totalItems$;
    this.isLoading$ = this.employeeService.isLoading$;
  }

  ngOnInit(): void {
    this.isAdmin = this.userService.isAdmin();
    this.canManage = this.isAdmin || this.userService.hasPermission('MANAGE_EMPLOYEES');
    this.loadEmployees();

    this.searchSubscription = this.searchControl.valueChanges.pipe(
        debounceTime(400)
    ).subscribe(value => {
        this.currentPage = 1;
        this.loadEmployees();
    });
  }

  loadEmployees(): void {
    const searchTerm = this.searchControl.value || '';
    this.employeeService.getEmployees(searchTerm, this.currentPage, this.pageSize);
  }

  onWorkModeChange(event: MatSlideToggleChange, employee: Employee): void {
    const newMode = event.checked ? 'Remote' : 'Onsite';
    const modeText = newMode === 'Remote' ? 'Làm việc từ xa' : 'Làm tại văn phòng';

    this.employeeService.updateWorkMode(employee.id, newMode).subscribe({
      next: (res) => {
        this.snackBar.open(`Đã cập nhật chế độ cho ${employee.lastName} thành "${modeText}"`, 'Đóng', { 
          duration: 3000, 
          panelClass: 'success-snackbar' 
        });
        employee.workMode = newMode; 
      },
      error: (err) => {
        this.snackBar.open('Cập nhật thất bại: ' + (err.error?.message || err.message), 'Đóng', { duration: 4000 });
        event.source.checked = !event.checked; 
      }
    });
  }
  onToggleLock(element: Employee): void {
      if (!element.userId) {
          this.snackBar.open('Nhân viên này chưa liên kết tài khoản user hệ thống.', 'Đóng', { duration: 3000 });
          return;
      }

      const actionText = element.isLocked ? 'MỞ KHÓA' : 'KHÓA';
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          width: '400px',
          data: {
              title: `Xác nhận ${actionText}`,
              message: `Bạn có chắc muốn <b>${actionText}</b> tài khoản của nhân viên <b>${element.lastName}</b> không?`
          }
      });

      dialogRef.afterClosed().subscribe(result => {
          if (result === true) {
              this.authApiService.toggleLock(element.userId!).subscribe({
                  next: (res) => {
                      this.snackBar.open(res.message, 'Đóng', { duration: 3000 });
                      this.loadEmployees(); 
                  },
                  error: (err) => {
                      const msg = err.error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái.';
                      this.snackBar.open(msg, 'Đóng', { duration: 5000 });
                  }
              });
          }
      });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadEmployees();
  }

  clearSearch() {
      this.searchControl.setValue('');
  }

  getFullUrl(url: string | undefined): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${this.baseUrl}${url}`;
  }

  onDelete(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
          title: 'Xác nhận xóa',
          message: `Bạn có chắc chắn muốn xóa nhân viên ID: <b>${id}</b>?` 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.employeeService.deleteEmployee(id).subscribe({
          next: () => {
            this.snackBar.open('Xóa thành công!', 'Đóng', { duration: 3000 });
          },
          error: (err) => {
             this.snackBar.open('Xóa thất bại: ' + err.message, 'Đóng', { duration: 3000 });
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }
}