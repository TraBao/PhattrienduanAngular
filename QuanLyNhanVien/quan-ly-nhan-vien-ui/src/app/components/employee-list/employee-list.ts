import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmployeeService } from '../../services/employee';
import { Employee } from '../../models/employee.model';
import { MaterialModule } from '../../material-module';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { UserService } from '../../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    RouterModule,
    MatSortModule
  ],
  templateUrl: './employee-list.html',
  styleUrls: ['./employee-list.scss']
})
export class EmployeeList implements OnInit, OnDestroy, AfterViewInit {
  isAdmin: boolean = false;
  dataSource: MatTableDataSource<Employee> = new MatTableDataSource<Employee>();

  displayedColumns: string[] = ['id', 'avatar', 'firstName', 'lastName', 'email', 'salary', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  private userSub: Subscription = new Subscription();
  private baseUrl = 'http://localhost:5195';

  constructor(
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.userSub = this.userService.currentUser$.subscribe(user => {
      this.isAdmin = user ? user.roles.includes('Admin') : false;
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
        next: (data) => {
          console.log('Dữ liệu nhân viên:', data);
          this.dataSource.data = data;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        },
        error: (err) => console.error('Lỗi tải data:', err)
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  getFullUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url; 
    return `${this.baseUrl}${url}`;
  }

  onDelete(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
          title: 'Xác nhận xóa',
          message: `Bạn có chắc chắn muốn xóa nhân viên có ID: <b>${id}</b>?<br>Thao tác này không thể hoàn tác.` 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.employeeService.deleteEmployee(id).subscribe({
          next: () => {
            this.snackBar.open('Xóa thành công!', 'Đóng', { duration: 3000, panelClass: ['success-snackbar'] });
            this.loadEmployees();
          },
          error: () => {
              this.snackBar.open('Lỗi xóa nhân viên', 'Đóng', { duration: 3000, panelClass: ['error-snackbar'] });
          }
        });
      }
    });
  }
}