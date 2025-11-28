import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../../services/payroll.service';
import { UserService } from '../../services/user.service';
import { Payroll } from '../../models/payroll.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './payroll.html',
  styleUrls: ['./payroll.scss']
})
export class PayrollComponent implements OnInit {
  isAdmin: boolean = false;
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  years = [2024, 2025, 2026];
  dataSource = new MatTableDataSource<Payroll>();
  displayedColumns: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private payrollService: PayrollService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.userService.isAdmin();

    if (this.isAdmin) {
      this.displayedColumns = ['employeeName', 'basicSalary', 'workDays', 'finalSalary', 'status', 'actions'];
      this.loadMonthlyPayroll();
    } else {
      this.displayedColumns = ['monthYear', 'basicSalary', 'workDays', 'finalSalary', 'status'];
      this.loadMyPayslips();
    }
  }
  loadMonthlyPayroll() {
    this.payrollService.getMonthlyPayroll(this.selectedMonth, this.selectedYear).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        setTimeout(() => this.dataSource.paginator = this.paginator);
      },
      error: () => console.log('Chưa có dữ liệu lương tháng này')
    });
  }

  onCalculate() {
    if(confirm(`Bạn có chắc muốn tính lương cho tháng ${this.selectedMonth}/${this.selectedYear}?`)) {
      this.payrollService.calculatePayroll(this.selectedMonth, this.selectedYear).subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Đóng', { duration: 3000, panelClass: 'success-snackbar' });
          this.loadMonthlyPayroll();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Lỗi tính lương', 'Đóng', { duration: 3000, panelClass: 'error-snackbar' });
        }
      });
    }
  }

  markPaid(id: number) {
    this.payrollService.markAsPaid(id).subscribe(() => {
      this.snackBar.open('Đã xác nhận thanh toán', 'Đóng', { duration: 2000 });
      this.loadMonthlyPayroll();
    });
  }

  loadMyPayslips() {
    this.payrollService.getMyPayslips().subscribe(data => {
      this.dataSource.data = data;
      setTimeout(() => this.dataSource.paginator = this.paginator);
    });
  }
  onExport() {
    this.payrollService.exportPayroll(this.selectedMonth, this.selectedYear).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BangLuong_T${this.selectedMonth}_${this.selectedYear}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.snackBar.open('Xuất file thành công!', 'Đóng', { duration: 3000, panelClass: 'success-snackbar' });
      },
      error: () => {
        this.snackBar.open('Lỗi: Không có dữ liệu hoặc lỗi Server', 'Đóng', { duration: 3000, panelClass: 'error-snackbar' });
      }
    });
  }
}