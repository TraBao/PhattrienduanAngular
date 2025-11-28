import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { AttendanceService } from '../../services/attendance.service';
import { Attendance } from '../../models/attendance.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { AnnouncementService, Announcement } from '../../services/announcement.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, MaterialModule],
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
    }, 1000);
  }

  loadTodayStatus() {
    this.attendanceService.getTodayStatus().subscribe({
        next: (data) => {
              this.todayRecord = data;
        },
        error: (err) => console.error(err)
    });
  }

  loadHistory() {
    this.attendanceService.getMyHistory().subscribe(data => {
      this.historySource.data = data;
      setTimeout(() => this.historySource.paginator = this.paginator);
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
}