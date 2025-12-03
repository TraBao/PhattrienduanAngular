import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LeaveService } from '../../services/leave.service';
import { UserService } from '../../services/user.service';
import { LeaveRequest } from '../../models/leave.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-leave-manager',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatTooltipModule
  ],
  templateUrl: './leave-manager.html',
  styleUrls: ['./leave-manager.scss']
})
export class LeaveManagerComponent implements OnInit {
  isAdmin: boolean = false;
  myLeavesSource = new MatTableDataSource<LeaveRequest>();
  myDisplayedColumns: string[] = ['startDate', 'reason', 'status', 'actions'];
  allLeavesSource = new MatTableDataSource<LeaveRequest>();
  adminDisplayedColumns: string[] = ['fullName', 'startDate', 'reason', 'status', 'adminActions'];
  
  leaveForm: FormGroup;
  showForm = false;

  @ViewChild('paginatorMy') paginatorMy!: MatPaginator;
  @ViewChild('paginatorAll') paginatorAll!: MatPaginator;

  constructor(
    private leaveService: LeaveService,
    private userService: UserService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.leaveForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      reason: ['', Validators.required]
    }, { validators: dateRangeValidator });
  }

  ngOnInit(): void {
    this.isAdmin = this.userService.isAdmin();
    
    this.loadMyLeaves();
    if (this.isAdmin) {
      this.loadAllLeaves();
    }
  }

  loadMyLeaves() {
    this.leaveService.getMyLeaves().subscribe({
        next: (data) => {
            this.myLeavesSource.data = data;
            setTimeout(() => {
                this.myLeavesSource.paginator = this.paginatorMy;
            });
        },
        error: (err) => console.error(err)
    });
  }

  loadAllLeaves() {
    this.leaveService.getAllLeaves().subscribe({
        next: (data) => {
            this.allLeavesSource.data = data;
            setTimeout(() => {
                if (this.paginatorAll) {
                    this.allLeavesSource.paginator = this.paginatorAll;
                }
            });
        },
        error: (err) => {
            if(err.status === 403) {
                  this.snackBar.open('Vui lòng đăng nhập lại.', 'Đóng', { duration: 5000 });
            }
        }
    });
  }

  onSubmitRequest() {
    if (this.leaveForm.valid) {
      this.leaveService.createRequest(this.leaveForm.value).subscribe({
        next: () => {
          this.snackBar.open('Gửi đơn thành công!', 'Đóng', { duration: 3000, panelClass: 'success-snackbar' });
          this.showForm = false;
          this.leaveForm.reset();
          this.loadMyLeaves();
          if(this.isAdmin) this.loadAllLeaves();
        },
        error: () => this.snackBar.open('Lỗi khi gửi đơn', 'Đóng', { duration: 3000, panelClass: 'error-snackbar' })
      });
    }
  }

  cancelRequest(id: number) {
    if(confirm('Bạn muốn xóa đơn này?')) {
        this.leaveService.deleteRequest(id).subscribe(() => {
            this.snackBar.open('Đã xóa đơn', 'Đóng', { duration: 2000, panelClass: 'success-snackbar' });
            this.loadMyLeaves();
            if(this.isAdmin) this.loadAllLeaves();
        });
    }
  }

  approve(id: number) {
    this.updateStatus(id, 'Approved');
  }

  reject(id: number) {
    const reason = prompt("Nhập lý do từ chối:");
    if (reason !== null) {
        this.updateStatus(id, 'Rejected', reason);
    }
  }

  updateStatus(id: number, status: string, comment: string = '') {
    this.leaveService.updateStatus({ requestId: id, status, adminComment: comment }).subscribe({
        next: () => {
            this.snackBar.open(`Đã ${status} đơn này`, 'Đóng', { duration: 3000, panelClass: 'success-snackbar' });
            this.loadAllLeaves();
            this.loadMyLeaves();
        },
        error: () => this.snackBar.open('Lỗi xử lý', 'Đóng', { duration: 3000, panelClass: 'error-snackbar' })
    });
  }
}

export const dateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const start = control.get('startDate')?.value;
  const end = control.get('endDate')?.value;
  return start && end && new Date(start) > new Date(end) ? { dateInvalid: true } : null;
};