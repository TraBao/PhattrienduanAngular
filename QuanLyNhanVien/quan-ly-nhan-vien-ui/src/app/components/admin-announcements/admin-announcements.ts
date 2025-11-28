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
    if (!this.title || !this.content) return;

    const newNews = {
        title: this.title,
        content: this.content,
        isImportant: this.isImportant
    };

    this.announcementService.create(newNews).subscribe(() => {
        this.snackBar.open('Đăng thông báo thành công!', 'Đóng', { duration: 3000 });
        this.title = '';
        this.content = '';
        this.isImportant = false;
        this.loadAnnouncements();
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
      if(confirm('Bạn có chắc muốn xóa tin này?')) {
          this.announcementService.delete(id).subscribe(() => {
              this.loadAnnouncements();
              this.snackBar.open('Đã xóa tin.', 'Đóng', { duration: 2000 });
          });
      }
  }
}