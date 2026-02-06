import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material-module';
import { MeetingService } from '../../services/meeting.service';
import { Meeting } from '../../models/meeting.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './meeting-list.html',
  styleUrls: ['./meeting-list.scss']
})
export class MeetingListComponent implements OnInit {
  meetings: Meeting[] = [];
  newMeetingTitle: string = '';
  isInMeeting: boolean = false;
  currentMeetingUrl: SafeResourceUrl | null = null;
  currentMeetingTitle: string = '';

  constructor(
    private meetingService: MeetingService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadMeetings();
  }

  loadMeetings() {
    this.meetingService.getMeetings().subscribe({
      next: (data) => {
        console.log('Dữ liệu phòng họp tải về:', data);
        this.meetings = data;
      },
      error: (err) => console.error('Lỗi tải danh sách:', err)
    });
  }

  createMeeting() {
    console.log('--- ĐÃ BẤM NÚT TẠO PHÒNG ---');
    console.log('Giá trị nhập vào là:', this.newMeetingTitle);

    if (!this.newMeetingTitle || !this.newMeetingTitle.trim()) {
        alert('Ô nhập liệu đang trống! Vui lòng nhập tên phòng.');
        return;
    }
    console.log('Đang gọi API tạo phòng...');
    this.meetingService.createMeeting(this.newMeetingTitle).subscribe({
      next: (res) => {
        console.log('Tạo thành công:', res);
        this.snackBar.open('Đã tạo phòng họp mới!', 'OK', { duration: 3000 });
        this.newMeetingTitle = '';
        this.loadMeetings();
      },
      error: (err) => {
        console.error('Lỗi API:', err);
        alert('Lỗi tạo phòng: ' + (err.error?.message || err.statusText || 'Lỗi kết nối Server'));
      }
    });
  }

  joinMeeting(meeting: Meeting) {
    const jitsiUrl = `https://meet.jit.si/${meeting.roomId}#config.prejoinPageEnabled=false`;
    this.currentMeetingUrl = this.sanitizer.bypassSecurityTrustResourceUrl(jitsiUrl);
    this.currentMeetingTitle = meeting.title;
    this.isInMeeting = true;
  }

  leaveMeeting() {
    this.isInMeeting = false;
    this.currentMeetingUrl = null;
    this.loadMeetings();
  }

  endMeeting(id: number, event: Event) {
    event.stopPropagation();
    if(confirm('Bạn có chắc muốn kết thúc cuộc họp này?')) {
      this.meetingService.endMeeting(id).subscribe({
        next: () => {
          this.loadMeetings();
          this.snackBar.open('Đã xóa.', 'OK', { duration: 2000 });
        },
        error: (err) => console.error(err)
      });
    }
  }
}