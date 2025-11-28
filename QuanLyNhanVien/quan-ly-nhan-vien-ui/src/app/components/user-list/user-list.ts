import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { UserService, UserInfo } from '../../services/user.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.scss']
})
export class UserListComponent implements OnInit, AfterViewInit {
  
  displayedColumns: string[] = ['email', 'roles', 'actions'];
  dataSource: MatTableDataSource<UserInfo> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}
  ngOnInit(): void {
    this.loadUsers();
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.dataSource.data = users;
        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Lỗi kết nối: Không thể tải danh sách tài khoản.', 'Đóng', { 
            duration: 3000, 
            panelClass: ['error-snackbar'] 
        });
      }
    });
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  toggleRole(user: UserInfo) {
    const isCurrentlyAdmin = user.roles.includes('Admin');
    const newRoles = isCurrentlyAdmin ? ['User'] : ['Admin', 'User'];
    const actionText = isCurrentlyAdmin ? 'Hạ quyền Admin' : 'Thăng cấp Admin';

    if(confirm(`Bạn có chắc chắn muốn ${actionText} cho tài khoản ${user.email}?`)) {
        this.userService.updateUserRole(user.email, newRoles).subscribe({
            next: () => {
                this.snackBar.open(`Thành công: Đã ${actionText} cho ${user.email}`, 'Đóng', {
                    duration: 3000, 
                    panelClass: ['success-snackbar']
                });
                this.loadUsers();
            },
            error: (err) => {
                console.error(err);
                this.snackBar.open('Lỗi: Không thể cập nhật quyền. Vui lòng thử lại.', 'Đóng', {
                    duration: 3000,
                    panelClass: ['error-snackbar']
                });
            }
        });
    }
  }
}