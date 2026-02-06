import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { AttendanceService, CheckInPayload } from '../../services/attendance.service';
import { Attendance } from '../../models/attendance.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { AnnouncementService, Announcement } from '../../services/announcement.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { WebcamModule, WebcamImage, WebcamUtil } from 'ngx-webcam';
import { EmployeeService } from '../../services/employee';
import { Employee } from '../../models/employee.model';
import { Subject, Observable } from 'rxjs';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, MaterialModule, MatProgressBarModule, WebcamModule],
  templateUrl: './user-dashboard.html',
  styleUrls: ['./user-dashboard.scss']
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  todayRecord: Attendance | null = null;
  historySource = new MatTableDataSource<Attendance>();
  displayedColumns: string[] = ['date', 'checkIn', 'checkOut', 'totalHours', 'status'];
  
  currentTime: Date = new Date();
  private timer: any;
  announcements: Announcement[] = [];
  workHoursNow: number = 0;
  workProgress: number = 0;
  isCheckingIn = false;

  currentUser: Employee | null = null;
  showWebcam = false;
  webcamImage: WebcamImage | null = null;
  
  private trigger: Subject<void> = new Subject<void>();
  public triggerObservable: Observable<void> = this.trigger.asObservable();
  
  public webcamError: string | null = null;
  public multipleWebcamsAvailable = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private attendanceService: AttendanceService,
    private snackBar: MatSnackBar,
    private announcementService: AnnouncementService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.startClock();
    this.loadMyProfile();
    this.loadTodayStatus();
    this.loadHistory();
    this.loadAnnouncements();
    WebcamUtil.getAvailableVideoInputs()
      .then((mediaDevices: MediaDeviceInfo[]) => {
        this.multipleWebcamsAvailable = mediaDevices && mediaDevices.length > 1;
      });
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
  loadMyProfile() {
    this.employeeService.getMyProfile().subscribe({
      next: (employee) => this.currentUser = employee,
      error: (err) => console.error("Không thể tải thông tin cá nhân:", err)
    });
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
    onCheckIn(): void {
    if (!this.currentUser) {
      this.snackBar.open('Đang tải thông tin của bạn, vui lòng thử lại sau giây lát.', 'Đóng', { duration: 3000 });
      return;
    }

    if (this.currentUser.workMode === 'Remote') {
      this.showWebcam = true;
    } else {
      this.checkInWithGPS();
    }
  }
    checkInWithGPS(): void {
    if (!navigator.geolocation) {
      this.snackBar.open('Trình duyệt của bạn không hỗ trợ định vị GPS.', 'Đóng', { duration: 3000 });
      return;
    }

    this.isCheckingIn = true;
    this.snackBar.open('Đang xác định vị trí của bạn...', 'Đóng');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.snackBar.dismiss();
        
        const payload: CheckInPayload = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        this.submitCheckIn(payload);
      },
      (error) => {
        this.isCheckingIn = false;
        let errorMessage = 'Không thể lấy được vị trí. Vui lòng thử lại!';
        if (error.code === error.PERMISSION_DENIED) {
            errorMessage = 'Bạn đã từ chối quyền truy cập vị trí.';
        }
        this.snackBar.open(errorMessage, 'Đóng', { duration: 5000 });
      }
    );
  }
    public handleInitError(error: any): void {
    this.webcamError = error.message;
    if (error.name === "NotAllowedError") {
      this.webcamError = "Bạn đã không cấp quyền sử dụng camera.";
    }
  }

  // HÀM MỚI: Chụp ảnh
  public triggerSnapshot(): void {
    this.trigger.next();
  }

  // HÀM MỚI: Nhận ảnh sau khi chụp
  public handleImage(webcamImage: WebcamImage): void {
    this.webcamImage = webcamImage;
  }

  // HÀM MỚI: Chuyển data URL của ảnh thành File để upload
  private dataURItoBlob(dataURI: string): Blob {
    const byteString = window.atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  // HÀM MỚI: Gửi ảnh selfie đi
  public submitSelfie(): void {
    if (!this.webcamImage) return;

    this.isCheckingIn = true;
    const blob = this.dataURItoBlob(this.webcamImage.imageAsDataUrl);
    const imageFile = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });

    const payload: CheckInPayload = {
      selfie: imageFile
    };
    
    this.submitCheckIn(payload);
  }
  
  // HÀM MỚI: Hàm submit check-in chung cho cả 2 trường hợp
  private submitCheckIn(payload: CheckInPayload): void {
    this.isCheckingIn = true;
    this.attendanceService.checkIn(payload).subscribe({
      next: (res) => {
        this.snackBar.open('Check-in thành công!', 'Đóng', { duration: 3000, panelClass: 'success-snackbar' });
        this.todayRecord = res.data;
        this.loadHistory();
        this.isCheckingIn = false;
        this.showWebcam = false; // Đóng webcam sau khi thành công
        this.webcamImage = null; // Reset ảnh
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Lỗi Check-in', 'Đóng', { duration: 5000 });
        this.isCheckingIn = false;
      }
    });
  }

  // HÀM MỚI: Đóng webcam và reset
  public closeWebcam(): void {
    this.showWebcam = false;
    this.webcamImage = null;
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
      let diffMs = now - start;
      const currentH = this.currentTime.getHours();
      const currentM = this.currentTime.getMinutes();
      if (currentH > 13 || (currentH === 13 && currentM > 30)) {
          diffMs -= (1.5 * 60 * 60 * 1000); 
      }

      const hours = diffMs / (1000 * 60 * 60);
      this.workHoursNow = hours > 0 ? hours : 0;
      this.workProgress = (this.workHoursNow / 8) * 100;
      if(this.workProgress > 100) this.workProgress = 100;
  }

  getStatusLabel(status: string): string {
    if (!status) return 'Đúng giờ';
    if (status === 'OnTime') return 'Đúng giờ';
    if (status === 'Late') return 'Đi muộn';
    if (status === 'EarlyLeave') return 'Về sớm';
    if (status.includes('Late') && status.includes('EarlyLeave')) return 'Muộn & Về sớm';
    return 'Vi phạm';
  }

  getStatusClass(status: string): string {
      if (!status) return 'status-success';
      if (status === 'OnTime') return 'status-success';
      if (status === 'Late') return 'status-warning';
      if (status === 'EarlyLeave') return 'status-info';
      return 'status-danger';
  }
}