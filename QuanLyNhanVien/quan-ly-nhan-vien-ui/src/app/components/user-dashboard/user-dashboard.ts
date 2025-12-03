import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { AttendanceService } from '../../services/attendance.service';
import { Attendance } from '../../models/attendance.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { AnnouncementService, Announcement } from '../../services/announcement.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, MaterialModule,MatProgressBarModule],
  templateUrl: './user-dashboard.html',
  styleUrls: ['./user-dashboard.scss']
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  todayRecord: Attendance | null = null;
  historySource = new MatTableDataSource<Attendance>();
  displayedColumns: string[] = ['date', 'checkIn', 'checkOut', 'totalHours'];
  
  currentTime: Date = new Date();
  private timer: any;
  announcements: Announcement[] = [];
  workHoursNow: number = 0; 
  workProgress: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private attendanceService: AttendanceService,
    private snackBar: MatSnackBar,
    private announcementService: AnnouncementService
  ) {}

  ngOnInit(): void {
    this.startClock();
    this.loadTodayStatus();
    this.loadHistory();
    this.loadAnnouncements();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
  loadAnnouncements() {
    this.announcementService.getAll().subscribe(data => this.announcements = data);
  }

  startClock() {
    this.timer = setInterval(() => {
      this.currentTime = new Date();
      if(this.todayRecord && !this.todayRecord.checkOutTime) {
          this.calculateWorkProgress(this.todayRecord.checkInTime);
      }
    }, 1000);
  }

  loadTodayStatus() {
    this.attendanceService.getTodayStatus().subscribe({
        next: (data) => {
              this.todayRecord = data;
              if(data && data.checkInTime && !data.checkOutTime) {
                  this.calculateWorkProgress(data.checkInTime);
              }
        },
        error: (err) => console.error(err)
    });
  }

  loadHistory() {
    this.attendanceService.getMyHistory().subscribe(data => {
      this.historySource.data = data;
      setTimeout(() => {
          if (this.paginator) this.historySource.paginator = this.paginator;
      });
    });
  }

  onCheckIn() {
    this.attendanceService.checkIn().subscribe({
      next: (res) => {
        this.snackBar.open('Check-in thành công!', 'Đóng', { duration: 3000, panelClass: 'success-snackbar' });
        this.todayRecord = res.data;
        this.loadHistory();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Lỗi Check-in', 'Đóng', { duration: 3000 })
    });
  }

  onCheckOut() {
    if(confirm('Bạn có chắc muốn kết thúc ngày làm việc không?')) {
        this.attendanceService.checkOut().subscribe({
            next: (res) => {
                this.snackBar.open('Check-out thành công!', 'Đóng', { duration: 3000, panelClass: 'success-snackbar' });
                this.todayRecord = res.data;
                this.loadHistory();
            },
            error: (err) => this.snackBar.open(err.error?.message || 'Lỗi Check-out', 'Đóng', { duration: 3000 })
        });
    }
  }
  isLateCheck(timeStringOrDate: string | Date | undefined): boolean {
    if (!timeStringOrDate) return false;
    const dateObj = new Date(timeStringOrDate);
    const h = dateObj.getHours();
    const m = dateObj.getMinutes();
    if (h > 8) return true;
    if (h === 8 && m > 15) return true;
    return false;
  }
  get isLunchBreak(): boolean {
    const h = this.currentTime.getHours();
    const m = this.currentTime.getMinutes();
    if (h === 12) return true;
    if (h === 13 && m <= 30) return true;
    return false;
  }
  calculateWorkProgress(checkInTimeStr: any) {
      if(!checkInTimeStr) return;
      const start = new Date(checkInTimeStr).getTime();
      const now = this.currentTime.getTime();
      const diffMs = now - start;
      const hours = diffMs / (1000 * 60 * 60);
      
      this.workHoursNow = hours > 0 ? hours : 0;
      this.workProgress = (this.workHoursNow / 8) * 100;
      if(this.workProgress > 100) this.workProgress = 100;
  }
}