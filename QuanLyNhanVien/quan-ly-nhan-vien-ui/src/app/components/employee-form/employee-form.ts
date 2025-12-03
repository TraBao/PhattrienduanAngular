import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { EmployeeService, NewEmployee } from '../../services/employee';
import { Employee } from '../../models/employee.model';
import { MaterialModule } from '../../material-module';
import { Department } from '../../models/department.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmployeeDocsComponent } from '../employee-docs/employee-docs';
import { MatDividerModule } from '@angular/material/divider';

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
export class EmployeeForm implements OnInit {
  employeeForm: any;
  employeeId: number | null = null;
  departments: Department[] = [];

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.employeeForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,11}$')]],
      address: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      salary: ['', [Validators.required, Validators.min(0)]],
      departmentId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.employeeService.getDepartments().subscribe(data => {
      this.departments = data;
    });

    this.route.paramMap.subscribe(params => {
      const idString = params.get('id');
      this.employeeForm.reset();
      
      if (idString && +idString > 0) {
        this.employeeId = +idString;
        this.loadEmployeeData(this.employeeId);
      } else {
        this.employeeId = null;
        this.employeeForm.patchValue({
          firstName: '', lastName: '', email: '',
          phone: '', address: '',
          dateOfBirth: '', salary: '', departmentId: ''
        });
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
      },
      error: (err) => {
        console.error('Lỗi tải dữ liệu nhân viên:', err);
        this.router.navigate(['/']);
      }
    });
  }

  handleServerError = (err: any): void => {
    if (err.status === 400 && err.error && err.error.errors) {
      const serverErrors = err.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const formControlName = key.charAt(0).toLowerCase() + key.slice(1);
          const control = this.employeeForm.get(formControlName);
          if (control) {
            control.setErrors({ 'server': serverErrors[key][0] });
          }
        }
      }
      this.snackBar.open('Vui lòng kiểm tra lại thông tin trên form.', 'Đóng', {
        duration: 5000, panelClass: ['error-snackbar']
      });
    } else {
      this.snackBar.open('Có lỗi xảy ra, vui lòng thử lại.', 'Đóng', {
        duration: 5000, panelClass: ['error-snackbar']
      });
      console.error('API Error:', err);
    }
  };

  onSubmit(): void {
    if (this.employeeForm.valid) {
      const formData = this.employeeForm.value;
      let formattedDateOfBirth = '';
      if (formData.dateOfBirth) {
        const date = new Date(formData.dateOfBirth);
        formattedDateOfBirth = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
                                .toISOString()
                                .split('T')[0];
      }
      const employeeData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        dateOfBirth: formattedDateOfBirth,
        salary: Number(formData.salary),
        departmentId: Number(formData.departmentId)
      };

      if (this.employeeId) {
        const updatePayload = { ...employeeData, id: this.employeeId };
        this.employeeService.updateEmployee(updatePayload).subscribe({
          next: () => {
            this.snackBar.open('Cập nhật thành công!', 'OK', {
              duration: 3000, panelClass: ['success-snackbar']
            });
            this.router.navigate(['/employees']);
          },
          error: this.handleServerError
        });
      } else {
        this.employeeService.createEmployee(employeeData).subscribe({
          next: () => {
            this.snackBar.open('Tạo mới thành công!', 'OK', {
              duration: 3000, panelClass: ['success-snackbar']
            });
            this.router.navigate(['/employees']);
          },
          error: this.handleServerError
        });
      }
    }
  }
}