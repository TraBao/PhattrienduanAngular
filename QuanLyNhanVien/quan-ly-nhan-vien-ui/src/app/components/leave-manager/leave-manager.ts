import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LeaveService } from '../../services/leave.service';
import { UserService } from '../../services/user.service';
import { LeaveRequest } from '../../models/leave.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
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
  canApproveLeaves: boolean = false;

  myLeavesSource = new MatTableDataSource<LeaveRequest>();
  myDisplayedColumns: string[] = ['startDate', 'leaveType', 'reason', 'status', 'actions'];
  allLeavesSource = new MatTableDataSource<LeaveRequest>();
  adminDisplayedColumns: string[] = ['fullName', 'startDate', 'leaveType', 'reason', 'status', 'adminActions'];
  totalAllItems = 0;
  pageSize = 10;
  currentPage = 1;

  leaveForm: FormGroup;
  showForm = false;

  @ViewChild('paginatorMy') paginatorMy!: MatPaginator;
  @ViewChild('paginatorAll') paginatorAll!: MatPaginator;

  constructor(
    private leaveService: LeaveService,
    public userService: UserService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.leaveForm = this.fb.group({
      startDate: [new Date(), Validators.required],
      endDate: [new Date(), Validators.required],
      leaveType: ['Annual', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(2)]]
    }, { validators: dateRangeValidator });
  }

  ngOnInit(): void {
    this.isAdmin = this.userService.isAdmin();
    this.canApproveLeaves = this.isAdmin || this.userService.hasPermission('MANAGE_LEAVES');

    this.loadMyLeaves();
    if (this.canApproveLeaves) {
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
        error: (err) => {
            console.error('Lỗi tải đơn cá nhân:', err);
            if(err.status === 0) console.error("Server API không phản hồi hoặc lỗi CORS");
        }
    });
  }

  loadAllLeaves() {
    this.leaveService.getAllLeaves('', this.currentPage, this.pageSize).subscribe({
        next: (res: any) => {
            this.allLeavesSource.data = res;
            setTimeout(() => {
                this.allLeavesSource.paginator = this.paginatorAll;
            });
        },
        error: (err) => {
            if(err.status === 403) {
                console.warn('Bạn không có quyền duyệt đơn nghỉ phép.');
                this.allLeavesSource.data = [];
            } else {
                  this.snackBar.open('Lỗi tải đơn cần duyệt.', 'Đóng', { duration: 3000 });
            }
        }
    });
  }

  onSubmitRequest() {
    if (this.leaveForm.invalid) {
      this.snackBar.open('Vui lòng nhập lý do (ít nhất 2 ký tự) và kiểm tra ngày tháng!', 'Đóng', { duration: 3000 });
      return;
    }

    this.leaveService.createRequest(this.leaveForm.value).subscribe({
      next: () => {
        this.snackBar.open('Gửi đơn thành công!', 'Đóng', { duration: 3000, panelClass: 'success-snackbar' });
        this.showForm = false;
        this.leaveForm.reset({ leaveType: 'Annual', startDate: new Date(), endDate: new Date() });
        this.loadMyLeaves();
      },
      error: (err) => {
        console.error("Lỗi API:", err);
        this.snackBar.open(err.error?.message || 'Lỗi server khi gửi đơn', 'Đóng');
      }
    });
  }

  cancelRequest(id: number) {
    if(confirm('Bạn có chắc chắn muốn xóa/hủy đơn xin nghỉ này?')) {
        this.leaveService.deleteRequest(id).subscribe({
            next: () => {
                this.snackBar.open('Đã hủy đơn thành công', 'Đóng', { duration: 2000 });
                this.loadMyLeaves();
                if(this.canApproveLeaves) this.loadAllLeaves();
            },
            error: (err) => {
                console.error("Lỗi hủy đơn:", err);
                this.snackBar.open(err.error?.message || 'Lỗi khi hủy đơn.', 'Đóng', {duration: 3000});
            }
        });
    }
  }

  approve(id: number) {
    this.updateStatus(id, 'Approved', 'Đã duyệt đơn bởi người quản lý.');
  }

  reject(id: number) {
    const reason = prompt("Lý do từ chối (Không bắt buộc):");
    if (reason !== null) {
        this.updateStatus(id, 'Rejected', reason);
    }
  }

  private updateStatus(id: number, status: string, comment: string) {
    this.leaveService.updateStatus({ requestId: id, status, adminComment: comment }).subscribe({
        next: () => {
            this.snackBar.open(`Đã cập nhật trạng thái: ${status}`, 'Đóng', { duration: 3000 });
            this.loadAllLeaves();
            this.loadMyLeaves();
        },
        error: (err) => {
            console.error("Lỗi cập nhật trạng thái:", err);
            this.snackBar.open(err.error?.message || 'Lỗi khi cập nhật trạng thái đơn', 'Đóng', {duration: 3000});
        }
    });
  }

  getStatusClass(status: string): string {
    if (!status) return 'status-pending';
    switch (status) {
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'Approved': return 'Đã duyệt';
      case 'Rejected': return 'Từ chối';
      default: return 'Đợi duyệt';
    }
  }

  getLeaveTypeLabel(type: string): string {
    switch (type) {
      case 'Annual': return 'Phép năm';
      case 'Sick': return 'Nghỉ ốm';
      case 'Unpaid': return 'Không lương';
      case 'Marriage': return 'Việc riêng (Hiếu hỉ)';
      default: return type;
    }
  }
}

export const dateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const start = control.get('startDate')?.value;
  const end = control.get('endDate')?.value;
  if (!start || !end) return null;

  const startDate = new Date(start);
  const endDate = new Date(end);
  startDate.setHours(0,0,0,0);
  endDate.setHours(0,0,0,0);

  return startDate > endDate ? { dateInvalid: true } : null;
};