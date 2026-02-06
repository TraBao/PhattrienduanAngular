import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { EmployeeService } from '../../services/employee';
import { MaterialModule } from '../../material-module';
import { Department } from '../../models/department.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmployeeDocsComponent } from '../employee-docs/employee-docs';
import { MatDividerModule } from '@angular/material/divider';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MaterialModule,
    EmployeeDocsComponent,
    MatDividerModule
  ],
  templateUrl: './employee-form.html',
  styleUrls: ['./employee-form.scss']
})
export class EmployeeFormComponent implements OnInit {
  employeeForm: FormGroup;
  employeeId: number | null = null;
  departments: Department[] = [];
  
  // === SỬA: Luôn cho phép edit ở frontend, backend sẽ chặn nếu không được phép ===
  canEdit: boolean = true; 
  
  previewUrl: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private userService: UserService
  ) {
    this.employeeForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10,11}$')]],
      address: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      salary: ['', [Validators.required, Validators.min(0)]],
      departmentId: ['', Validators.required],
      bankName: [''],
      bankAccountNumber: [''],
      bankAccountName: ['']
    });
  }

  ngOnInit(): void {
    this.employeeService.getDepartments().subscribe(data => {
      this.departments = data;
    });

    this.route.paramMap.subscribe(params => {
      const idString = params.get('id');
      this.employeeForm.reset();
      this.previewUrl = null;
      
      if (idString && +idString > 0) {
        this.employeeId = +idString;
        this.loadEmployeeData(this.employeeId);
      } else {
        this.employeeId = null;
        this.employeeForm.markAsUntouched();
      }
    });
  }

  loadEmployeeData(id: number): void {
    this.employeeService.getEmployee(id).subscribe({
      next: (employee) => {
        let dateOfBirthValue = employee.dateOfBirth ? new Date(employee.dateOfBirth) : null;
        this.employeeForm.patchValue({
          ...employee,
          dateOfBirth: dateOfBirthValue
        });
        if(employee.avatarUrl) {
            this.previewUrl = employee.avatarUrl.startsWith('http') ? employee.avatarUrl : `http://localhost:8080${employee.avatarUrl}`;
        }
      },
      error: (err) => {
        console.error('Lỗi tải dữ liệu nhân viên:', err);
        if (err.status === 403 || err.status === 404) {
             this.snackBar.open('Bạn không có quyền truy cập hồ sơ này.', 'Đóng', { duration: 3000 });
             this.router.navigate(['/employees']);
        }
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  handleServerError = (err: any): void => {
      this.snackBar.open('Có lỗi xảy ra: ' + (err.error?.message || err.statusText), 'Đóng', { duration: 3000 });
  };

  onSubmit(): void {
    if (!this.employeeForm.valid) {
        this.employeeForm.markAllAsTouched();
        this.snackBar.open('Vui lòng kiểm tra lại form.', 'Đóng', { duration: 3000 });
        return;
    }

    const formData = this.employeeForm.value;
    let formattedDateOfBirth = '';
    if (formData.dateOfBirth) {
        const date = new Date(formData.dateOfBirth);
        formattedDateOfBirth = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    }
    const employeeData = { ...formData, dateOfBirth: formattedDateOfBirth, salary: Number(formData.salary), departmentId: Number(formData.departmentId) };
    
    if (this.employeeId) {
        const updatePayload = { ...employeeData, id: this.employeeId };
        this.employeeService.updateEmployee(updatePayload).subscribe({
            next: () => {
                this.handleAvatarUpload(this.employeeId!, 'Cập nhật thành công!');
            },
            error: this.handleServerError
        });
    } 
    else {
        this.employeeService.createEmployee(employeeData).subscribe({
            next: (newlyCreatedEmployee) => {
                if (newlyCreatedEmployee && newlyCreatedEmployee.id) {
                    this.handleAvatarUpload(newlyCreatedEmployee.id, 'Tạo mới thành công!');
                }
            },
            error: this.handleServerError
        });
    }
  }

  private handleAvatarUpload(empId: number, successMsg: string) {
      if (this.selectedFile) {
          this.employeeService.uploadAvatar(empId, this.selectedFile).subscribe({
              next: () => {
                  this.snackBar.open(successMsg, 'OK', { duration: 3000 });
                  this.router.navigate(['/employees']);
              },
              error: (err) => {
                  this.snackBar.open(successMsg + ' (Nhưng lỗi upload ảnh)', 'OK', { duration: 3000 });
                  this.router.navigate(['/employees']);
              }
          });
      } else {
          this.snackBar.open(successMsg, 'OK', { duration: 3000 });
          this.router.navigate(['/employees']);
      }
  }
}