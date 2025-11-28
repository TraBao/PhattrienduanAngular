import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { EmployeeService } from '../../services/employee';
import { Employee } from '../../models/employee.model';
import { EmployeeDocsComponent } from '../employee-docs/employee-docs';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, MaterialModule, EmployeeDocsComponent, MatDividerModule],
  templateUrl: './my-profile.html',
  styleUrls: ['./my-profile.scss']
})
export class MyProfileComponent implements OnInit {
  employee: Employee | null = null;
  avatarDisplay: string | null = null; 
  private baseUrl = 'http://localhost:5195'; 

  constructor(
    private employeeService: EmployeeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.employeeService.getMyProfile().subscribe({
      next: (data) => {
        this.employee = data;
        if (this.employee && this.employee.avatarUrl) {
            this.avatarDisplay = this.employee.avatarUrl.startsWith('http') 
              ? this.employee.avatarUrl 
              : `${this.baseUrl}${this.employee.avatarUrl}`;
        }
      },
      error: (err) => console.error('Chưa có hồ sơ nhân viên', err)
    });
  }

onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      if (!file.type.match(/image\/*/)) {
        this.snackBar.open('Chỉ được upload file ảnh!', 'Đóng', { duration: 3000 });
        return;
      }
      if (this.employee) {
          this.employeeService.uploadAvatar(this.employee.id, file).subscribe({
            next: (res) => {
              this.avatarDisplay = res.url.startsWith('http') ? res.url : `${this.baseUrl}${res.url}`;
              this.snackBar.open('Cập nhật ảnh đại diện thành công!', 'Đóng', { duration: 3000 });
            },
            error: (err) => {
              console.error(err);
              this.snackBar.open('Lỗi khi upload ảnh', 'Đóng', { duration: 3000 });
            }
          });
      }
    }
  }
}