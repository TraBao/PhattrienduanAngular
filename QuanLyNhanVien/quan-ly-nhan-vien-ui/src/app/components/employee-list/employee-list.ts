import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmployeeService } from '../../services/employee';
import { Employee } from '../../models/employee.model';
import { MaterialModule } from '../../material-module';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { UserService } from '../../services/user.service';
import { Subscription } from 'rxjs';
import { AuthApiService } from '../../services/auth-api.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
      CommonModule, 
      MaterialModule, 
      RouterModule, 
      MatSortModule,
      MatTooltipModule 
  ],
  templateUrl: './employee-list.html',
  styleUrls: ['./employee-list.scss']
})
export class EmployeeListComponent implements OnInit, OnDestroy, AfterViewInit {
  isAdmin: boolean = false;
  canManage: boolean = false; 
  dataSource = new MatTableDataSource<Employee>();
  displayedColumns: string[] = ['id', 'avatar', 'firstName', 'lastName', 'email', 'salary', 'actions'];
  totalItems = 0;
  pageSize = 10;
  currentPage = 1;
  searchKey = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  private userSub: Subscription = new Subscription();
  private baseUrl = 'http://localhost:8080';

  constructor(
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public userService: UserService,
    private authApiService: AuthApiService
  ) {}

  ngOnInit(): void {
        this.isAdmin = this.userService.isAdmin();
        this.canManage = this.isAdmin || this.userService.hasPermission('MANAGE_EMPLOYEES');
        this.loadEmployees();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item: Employee, property: string) => {
      switch (property) {
        case 'id': return item.id;
        case 'firstName': return item.firstName;
        case 'lastName': return item.lastName;
        case 'email': return item.email;
        case 'salary': return item.salary;
        default: return (item as any)[property];
      }
    };
  }

  loadEmployees(): void {
    this.employeeService.getEmployees(this.searchKey, this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        const mappedData = res.data.map((item: any) => {
            if (item.employee) {
                return {
                    ...item.employee,
                    isLocked: item.isLocked,
                    userId: item.userId
                } as Employee;
            } else {
                return item as Employee;
            }
        });

        this.dataSource.data = mappedData;
        this.totalItems = res.totalItems;
        if (this.paginator) {
          this.paginator.length = this.totalItems;
        }
      },
      error: (err) => {
        console.error('Lỗi tải data:', err);
        this.snackBar.open('Không thể tải danh sách nhân viên', 'Đóng', { duration: 3000 });
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
                      element.isLocked = res.isLocked; 
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
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchKey = filterValue.trim().toLowerCase();
    this.currentPage = 1;
    this.loadEmployees();
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
            this.loadEmployees();
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
  }
}