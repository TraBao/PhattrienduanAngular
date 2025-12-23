import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../../services/payroll.service';
import { UserService } from '../../services/user.service';
import { Payroll } from '../../models/payroll.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { EmployeePayrollInputDto, PayrollCalculationRequestDto } from '../../models/payroll-calculation-request.dto';
import { Subject, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, AbstractControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PaymentQrDialogComponent } from '../../dialogs/payment-qr-dialog/payment-qr-dialog';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './payroll.html',
  styleUrls: ['./payroll.scss']
})
export class PayrollComponent implements OnInit, OnDestroy {
  canManage: boolean = false;
  
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  years = [2024, 2025, 2026];
  dataSource = new MatTableDataSource<Payroll>();
  displayedColumns: string[] = [];

  employeeInputForms: { [employeeId: number]: FormGroup } = {};

  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private payrollService: PayrollService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.canManage = this.userService.isAdmin() || this.userService.hasPermission('MANAGE_PAYROLL');

    if (this.canManage) {
      this.displayedColumns = [
        'employeeName',
        'basicSalary',
        'workDays',
        'overtimeInput',
        'allowanceInput',
        'bonusInput',
        'grossSalary',
        'socialInsuranceDeduction',
        'healthInsuranceDeduction', 
        'unemploymentInsuranceDeduction',
        'personalIncomeTaxDeduction',
        'totalDeductions',
        'netSalary',
        'status',
        'actions'
      ];
      this.loadMonthlyPayroll();
    } else {
      this.displayedColumns = [
        'monthYear', 
        'basicSalary', 
        'workDays', 
        'overtimePay', 
        'allowances', 
        'bonuses',
        'grossSalary', 
        'socialInsuranceDeduction', 
        'healthInsuranceDeduction', 
        'unemploymentInsuranceDeduction', 
        'personalIncomeTaxDeduction', 
        'totalDeductions', 
        'netSalary',   
        'status'
      ];
      this.loadMyPayslips();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  getFormControl(control: AbstractControl | null): FormControl {
    return control as FormControl;
  }

  loadMonthlyPayroll() {
    this.payrollService.getMonthlyPayroll(this.selectedMonth, this.selectedYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dataSource.data = data;
          if (this.paginator) {
              this.dataSource.paginator = this.paginator;
          }
          this.initEmployeeInputForms(data);
        },
        error: (err) => {
            this.dataSource.data = [];
            this.snackBar.open(err.error?.message || 'Lỗi tải dữ liệu bảng lương tháng.', 'Đóng', { duration: 3000, panelClass: 'error-snackbar' });
        }
      });
  }

  initEmployeeInputForms(payrolls: Payroll[]) {
    this.employeeInputForms = {};
    payrolls.forEach(payroll => {
      const hourlyRate = payroll.basicSalary / (26 * 8);
      let calculatedOvertimeHours = payroll.overtimePay > 0 ? (payroll.overtimePay / hourlyRate / 1.5) : 0;
      calculatedOvertimeHours = Math.round(calculatedOvertimeHours * 100) / 100;

      this.employeeInputForms[payroll.employeeId] = this.fb.group({
        overtimeHours: [calculatedOvertimeHours || 0, [Validators.min(0)]],
        allowancesAmount: [payroll.allowances || 0, [Validators.min(0)]],
        bonusesAmount: [payroll.bonuses || 0, [Validators.min(0)]]
      });
    });
  }

  onCalculate() {
    if(!confirm(`Bạn có chắc muốn tính lương cho tháng ${this.selectedMonth}/${this.selectedYear}?`)) {
      return;
    }

    const employeeInputs: EmployeePayrollInputDto[] = [];
    for (const employeeId in this.employeeInputForms) {
      if (this.employeeInputForms.hasOwnProperty(employeeId)) {
        const formGroup = this.employeeInputForms[employeeId];
        if (formGroup.valid) {
          employeeInputs.push({
            employeeId: parseInt(employeeId, 10),
            overtimeHours: formGroup.get('overtimeHours')?.value || 0,
            allowancesAmount: formGroup.get('allowancesAmount')?.value || 0,
            bonusesAmount: formGroup.get('bonusesAmount')?.value || 0,
          });
        } else {
          this.snackBar.open(`Lỗi nhập liệu cho nhân viên ID ${employeeId}. Vui lòng kiểm tra lại.`, 'Đóng', { duration: 5000, panelClass: 'error-snackbar' });
          return;
        }
      }
    }

    const requestDto: PayrollCalculationRequestDto = {
      month: this.selectedMonth,
      year: this.selectedYear,
      employeeInputs: employeeInputs
    };

    this.payrollService.calculatePayroll(requestDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Đóng', { duration: 3000, panelClass: 'success-snackbar' });
          this.loadMonthlyPayroll();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Lỗi tính lương (Có thể do quyền hạn hoặc dữ liệu đã tồn tại)', 'Đóng', { duration: 3000, panelClass: 'error-snackbar' });
        }
      });
  }

  markPaid(id: number) {
      this.payrollService.markAsPaid(id).subscribe({
          next: () => {
              this.snackBar.open('Đã cập nhật trạng thái thanh toán!', 'Đóng', { duration: 3000, panelClass: 'success-snackbar' });
              this.loadMonthlyPayroll();
          },
          error: (err) => this.snackBar.open(err.error?.message || 'Lỗi', 'Đóng', { duration: 3000, panelClass: 'error-snackbar' })
      });
  }

  loadMyPayslips() {
    this.payrollService.getMyPayslips()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dataSource.data = data;
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
        },
        error: (err) => {
          this.dataSource.data = [];
          this.snackBar.open(err.error?.message || 'Lỗi tải phiếu lương cá nhân.', 'Đóng', { duration: 3000, panelClass: 'error-snackbar' });
        }
      });
  }

  onExport() {
    this.payrollService.exportPayroll(this.selectedMonth, this.selectedYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `BangLuong_T${this.selectedMonth}_${this.selectedYear}.xlsx`;
          a.click();
          window.URL.revokeObjectURL(url);
          
          this.snackBar.open('Xuất file thành công!', 'Đóng', { duration: 3000, panelClass: 'success-snackbar' });
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Lỗi: Không có dữ liệu hoặc không đủ quyền', 'Đóng', { duration: 3000, panelClass: 'error-snackbar' });
        }
      });
    }
    onSavePayrollDetails(row: Payroll) {
    if (!this.employeeInputForms[row.employeeId]) {
      console.warn('Không tìm thấy formGroup cho employeeId:', row.employeeId);
      return;
    }

    if (this.employeeInputForms[row.employeeId].valid) {
        const formGroup = this.employeeInputForms[row.employeeId];
        const updatePayload: any = {
            overtimeHours: formGroup.get('overtimeHours')?.value || 0,
            allowancesAmount: formGroup.get('allowancesAmount')?.value || 0,
            bonusesAmount: formGroup.get('bonusesAmount')?.value || 0,
        };

        this.payrollService.updatePayrollDetails(row.id, updatePayload)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                  this.snackBar.open('Đã lưu thông tin lương.', 'Đóng', { duration: 2000, panelClass: 'success-snackbar' });
                  this.loadMonthlyPayroll();
                },
                error: (error) => {
                  this.snackBar.open('Lỗi: Không thể lưu thông tin lương.', 'Đóng', { duration: 3000, panelClass: 'error-snackbar' });
                  console.error('Lỗi khi cập nhật thông tin lương:', error);
                }
            });
    } else {
        this.snackBar.open('Vui lòng kiểm tra lại các giá trị đã nhập.', 'Đóng', { duration: 3000, panelClass: 'error-snackbar' });
    }
  }
  openPaymentDialog(row: Payroll) {
    const bankName = row.employee?.bankName || 'MB';
    const bankAccount = row.employee?.bankAccountNumber || '0000123456789';
    
    const dialogRef = this.dialog.open(PaymentQrDialogComponent, {
      width: '400px',
      data: {
        employeeName: row.employeeName,
        amount: row.netSalary,
        bankName: bankName,
        bankAccount: bankAccount,
        content: `LUONG T${row.month} ${row.year} ${row.employeeName}`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.markPaid(row.id);
      }
    });
}
}