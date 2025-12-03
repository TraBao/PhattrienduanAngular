import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material-module';
import { AnnouncementService } from '../../services/announcement.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-admin-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './admin-announcements.html',
  styleUrls: ['./admin-announcements.scss']
})
export class AdminAnnouncementsComponent implements OnInit {
  title = '';
  content = '';
  isImportant = false;
  announcements: any[] = [];

  constructor(
    private announcementService: AnnouncementService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  createAnnouncement() {
    if (!this.title.trim() || !this.content.trim()) {
        this.snackBar.open('Vui lòng nhập đầy đủ tiêu đề và nội dung!', 'Đóng', { duration: 2000, panelClass: 'error-snackbar' });
        return;
    }

    const newNews = {
        title: this.title,
        content: this.content,
        isImportant: this.isImportant
    };

    this.announcementService.create(newNews).subscribe({
        next: () => {
            this.snackBar.open('Đăng thông báo thành công!', 'OK', { duration: 3000, panelClass: 'success-snackbar' });
            this.title = '';
            this.content = '';
            this.isImportant = false;
            this.loadAnnouncements();
        },
        error: (err) => {
            console.error(err);
            this.snackBar.open('Lỗi khi đăng tin!', 'Đóng', { duration: 3000 });
        }
    });
  }

  loadAnnouncements() {
      this.announcementService.getAll().subscribe(data => {
          this.announcements = data.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      });
  }

  deleteNews(id: number) {
      if(confirm('Bạn có chắc muốn xóa thông báo này không?')) {
          this.announcementService.delete(id).subscribe(() => {
              this.loadAnnouncements();
              this.snackBar.open('Đã xóa tin.', 'Đóng', { duration: 2000 });
          });
      }
  }
}