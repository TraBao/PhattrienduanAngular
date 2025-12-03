    import { Component } from '@angular/core';
    import { CommonModule } from '@angular/common';
    import { MaterialModule } from '../../material-module';
    import { MatExpansionModule } from '@angular/material/expansion'; 

    @Component({
    selector: 'app-policy-dialog',
    standalone: true,
    imports: [CommonModule, MaterialModule, MatExpansionModule],
    template: `
        <h2 mat-dialog-title>
        <mat-icon class="title-icon">menu_book</mat-icon> Nội quy công ty
        </h2>
        
        <mat-dialog-content class="policy-content">
        <p class="intro-text">Những quy định chung giúp môi trường làm việc chuyên nghiệp & hiệu quả.</p>

        <mat-accordion multi>
            <!-- Quy định 1 -->
            <mat-expansion-panel expanded>
            <mat-expansion-panel-header>
                <mat-panel-title>
                <mat-icon>schedule</mat-icon> 1. Thời gian làm việc
                </mat-panel-title>
            </mat-expansion-panel-header>
            <div class="rule-detail">
                <ul>
                <li><strong>Giờ hành chính:</strong> 8:00 - 17:30 (Thứ 2 đến Thứ 6).</li>
                <li><strong>Nghỉ trưa:</strong> 12:00 - 13:30.</li>
                <li>Nhân viên đi muộn quá <strong>15 phút</strong> phải báo cáo quản lý trực tiếp.</li>
                <li>OT (Làm thêm giờ) phải có yêu cầu từ cấp trên.</li>
                </ul>
            </div>
            </mat-expansion-panel>

            <!-- Quy định 2 -->
            <mat-expansion-panel>
            <mat-expansion-panel-header>
                <mat-panel-title>
                <mat-icon>checkroom</mat-icon> 2. Trang phục & Tác phong
                </mat-panel-title>
            </mat-expansion-panel-header>
            <div class="rule-detail">
                <p>Trang phục lịch sự, gọn gàng (Áo có cổ, quần dài/váy công sở).</p>
                <p>Thứ 6 hàng tuần: <strong>Casual Friday</strong> (Được mặc tự do thoải mái).</p>
                <p>Đeo thẻ nhân viên khi ra vào tòa nhà.</p>
            </div>
            </mat-expansion-panel>

            <!-- Quy định 3 -->
            <mat-expansion-panel>
            <mat-expansion-panel-header>
                <mat-panel-title>
                <mat-icon>event_note</mat-icon> 3. Quy định Nghỉ phép
                </mat-panel-title>
            </mat-expansion-panel-header>
            <div class="rule-detail">
                <ul>
                <li>Xin nghỉ phép phải tạo đơn trên hệ thống trước ít nhất <strong>1 ngày</strong>.</li>
                <li>Nghỉ ốm đột xuất cần nộp giấy chứng nhận y tế sau khi đi làm lại.</li>
                <li>Mỗi nhân viên có 12 ngày phép năm.</li>
                </ul>
            </div>
            </mat-expansion-panel>

            <!-- Quy định 4 -->
            <mat-expansion-panel>
            <mat-expansion-panel-header>
                <mat-panel-title>
                <mat-icon>security</mat-icon> 4. Bảo mật thông tin
                </mat-panel-title>
            </mat-expansion-panel-header>
            <div class="rule-detail">
                <p>Không tiết lộ thông tin lương thưởng cho đồng nghiệp.</p>
                <p>Không mang dữ liệu dự án ra khỏi công ty khi chưa được phép.</p>
                <p>Khóa màn hình máy tính khi rời khỏi chỗ ngồi.</p>
            </div>
            </mat-expansion-panel>

        </mat-accordion>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close color="primary">Đã hiểu</button>
        </mat-dialog-actions>
    `,
    styles: [`
        h2 { display: flex; align-items: center; gap: 10px; color: #3f51b5; margin-bottom: 5px; }
        .intro-text { color: #666; font-style: italic; margin-bottom: 20px; font-size: 14px; }
        .policy-content { min-width: 450px; max-height: 70vh; padding-bottom: 20px; }
        mat-icon { color: #5c6bc0; margin-right: 10px; }
        .rule-detail { padding: 10px 0; font-size: 14px; line-height: 1.6; color: #333; }
        ul { padding-left: 20px; margin: 0; }
        li { margin-bottom: 5px; }
        .policy-content::-webkit-scrollbar { width: 6px; }
        .policy-content::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
    `]
    })
    export class PolicyDialogComponent {}