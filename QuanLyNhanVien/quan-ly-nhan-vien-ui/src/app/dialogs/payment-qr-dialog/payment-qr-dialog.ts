import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';

export interface PaymentDialogData {
  employeeName: string;
  amount: number;
  bankName: string;
  bankAccount: string;
  content: string;
}

@Component({
  selector: 'app-payment-qr-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <h2 mat-dialog-title>Thanh toán lương: {{data.employeeName}}</h2>
    <mat-dialog-content class="text-center">
      <div class="qr-container" *ngIf="qrUrl; else noBankInfo">
        <img [src]="qrUrl" alt="QR Code" class="qr-image"/>
        <p class="amount-text">Số tiền: <strong>{{data.amount | number:'1.0-0':'vi'}} đ</strong></p>
        <p class="note-text">Mở App Ngân hàng và quét mã để thanh toán</p>
      </div>
      <ng-template #noBankInfo>
        <div class="error-box">
          <mat-icon color="warn">warning</mat-icon>
          <p>Nhân viên này chưa cập nhật thông tin ngân hàng.</p>
        </div>
      </ng-template>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Hủy</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="true" cdkFocusInitial>
        <mat-icon>check</mat-icon> Xác nhận đã chuyển
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .qr-image { width: 100%; max-width: 300px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 15px; }
    .amount-text { font-size: 18px; color: #059669; margin: 10px 0; }
    .note-text { font-size: 13px; color: #6b7280; font-style: italic; }
    .error-box { padding: 30px; text-align: center; color: #dc2626; }
    .text-center { text-align: center; display: flex; flex-direction: column; align-items: center; }
  `]
})
export class PaymentQrDialogComponent {
  qrUrl: string = '';

  constructor(
    public dialogRef: MatDialogRef<PaymentQrDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData
  ) {
    if (data.bankName && data.bankAccount) {
      const content = encodeURIComponent(data.content);
      this.qrUrl = `https://img.vietqr.io/image/${data.bankName}-${data.bankAccount}-compact2.png?amount=${data.amount}&addInfo=${content}`;
    }
  }
}