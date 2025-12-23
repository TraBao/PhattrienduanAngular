import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material-module';
import { AnnouncementService } from '../../services/announcement.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../services/user.service';

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

  canManageAnnouncements: boolean = false;

  constructor(
    private announcementService: AnnouncementService,
    private snackBar: MatSnackBar,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.canManageAnnouncements = this.userService.isAdmin() || this.userService.hasPermission('MANAGE_ANNOUNCEMENTS');
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
            const errorMessage = err.status === 403 ? 'Bạn không có quyền đăng thông báo!' : (err.error?.message || 'Lỗi khi đăng tin!');
            this.snackBar.open(errorMessage, 'Đóng', { duration: 3000, panelClass: 'error-snackbar' });
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
          this.announcementService.delete(id).subscribe({
              next: () => {
                  this.loadAnnouncements();
                  this.snackBar.open('Đã xóa tin.', 'Đóng', { duration: 2000 });
              },
              error: (err) => {
                  console.error(err);
                   const errorMessage = err.status === 403 ? 'Bạn không có quyền xóa thông báo!' : (err.error?.message || 'Lỗi khi xóa tin!');
                  this.snackBar.open(errorMessage, 'Đóng', { duration: 3000, panelClass: 'error-snackbar' });
              }
          });
      }
  }
}