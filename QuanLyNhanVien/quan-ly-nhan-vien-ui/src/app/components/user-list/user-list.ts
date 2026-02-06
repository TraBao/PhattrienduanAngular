import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { UserService } from '../../services/user.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PermissionDialogComponent } from '../permission-dialog/permission-dialog';
import { User } from '../../models/user.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from '../confirm-dialog';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, MatTooltipModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.scss']
})
export class UserListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['email', 'roles', 'permissions', 'actions'];
  dataSource: MatTableDataSource<User> = new MatTableDataSource();
  currentUserEmail: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public userService: UserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.currentUserEmail = this.userService.getCurrentUserValue()?.email || '';
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'roles': return item.roles.join(',');
        default: return (item as any)[property];
      }
    };
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
  
  openRoleDialog(user: User, newRoles: string[]) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: { title: 'Xác nhận thay đổi vai trò', message: `Bạn có chắc muốn thay đổi vai trò của tài khoản <b>${user.email}</b> không?` }
      });
      
      dialogRef.afterClosed().subscribe(confirmed => {
        if(confirmed) {
            this.userService.updateUserRole(user.email, newRoles).subscribe({
                next: () => {
                    this.snackBar.open(`Cập nhật vai trò cho ${user.email} thành công!`, 'Đóng', {
                        duration: 3000, 
                        panelClass: ['success-snackbar']
                    });
                    this.loadUsers();
                },
                error: (err) => {
                    this.snackBar.open(err.error?.message || 'Lỗi: Không thể cập nhật vai trò.', 'Đóng', {
                        duration: 5000,
                        panelClass: ['error-snackbar']
                    });
                    this.loadUsers(); 
                }
            });
        } else {
            this.loadUsers();
        }
      });
  }
  
  isLocked(user: User): boolean {
    if (!user.lockoutEnd) {
      return false;
    }
    return new Date(user.lockoutEnd) > new Date();
  }
  
  toggleLock(user: User) {
    const action = this.isLocked(user) ? 'Mở khóa' : 'Khóa';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: { 
            title: `Xác nhận ${action}`,
            message: `Bạn có chắc muốn <b>${action}</b> tài khoản của <b>${user.email}</b>?`
        }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
        if(confirmed) {
            this.userService.toggleLock(user.id).subscribe({
              next: () => {
                this.snackBar.open(`Đã ${action} tài khoản thành công!`, 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
                this.loadUsers();
              },
              error: (err) => this.snackBar.open(err.error?.message || `Lỗi khi ${action} tài khoản.`, 'Đóng', { panelClass: ['error-snackbar'] })
            });
        }
    });
  }

  openPermissionDialog(user: User) {
    if (user.roles.includes('Admin')) {
        this.snackBar.open('Tài khoản Admin đã có toàn quyền truy cập.', 'Đóng', { duration: 2000 });
        return;
    }

    const dialogRef = this.dialog.open(PermissionDialogComponent, {
        width: '450px',
        disableClose: true,
        data: { 
            email: user.email,
            permissions: user.permissions
        }
    });

    dialogRef.afterClosed().subscribe(result => {
        if (result !== undefined) {
            this.userService.updatePermissions(user.id, result).subscribe({
                next: () => {
                    this.snackBar.open('Cập nhật quyền hạn thành công!', 'Đóng', { 
                        duration: 3000, panelClass: ['success-snackbar'] 
                    });
                    this.loadUsers();
                },
                error: (err) => {
                    console.error(err);
                    this.snackBar.open('Lỗi: Không thể lưu quyền hạn.', 'Đóng', { panelClass: ['error-snackbar'] });
                }
            });
        }
    });
  }
  
  deleteUser(user: User): void {
    if (user.isLinkedToEmployee) {
      this.snackBar.open('Không thể xóa tài khoản đã liên kết với nhân viên.', 'Đóng', { duration: 4000 });
      return;
    }
  
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: { 
            title: `Xác nhận xóa tài khoản`,
            message: `Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản <b>${user.email}</b>? Hành động này không thể hoàn tác.`
        }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
        if (confirmed) {
            this.userService.deleteUser(user.id).subscribe({
              next: () => {
                this.snackBar.open('Đã xóa tài khoản thành công!', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
                this.loadUsers();
              },
              error: (err) => {
                this.snackBar.open(err.error?.message || 'Lỗi khi xóa tài khoản.', 'Đóng', { panelClass: ['error-snackbar'] });
              }
            });
        }
    });
  }
}