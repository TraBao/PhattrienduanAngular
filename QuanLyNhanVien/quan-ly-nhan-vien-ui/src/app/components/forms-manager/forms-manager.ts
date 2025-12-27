import { Component, OnInit } from '@angular/core';
import { TemplateService } from '../../services/template';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { MatTooltipModule } from '@angular/material/tooltip'; 

@Component({
  selector: 'app-forms-manager',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MaterialModule],
  templateUrl: './forms-manager.html',
  styleUrls: ['./forms-manager.scss']
})
export class FormsManagerComponent implements OnInit {
  templates: any[] = [];
  canManageDocuments: boolean = false; 
  baseUrl = 'http://localhost:8080';

  constructor(
    private tplService: TemplateService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.canManageDocuments = this.userService.isAdmin() || this.userService.hasPermission('MANAGE_DOCUMENTS');
    this.loadTemplates();
  }

  loadTemplates() {
    this.tplService.getAll().subscribe({
      next: (res) => this.templates = res,
      error: (err) => console.error('Lỗi tải biểu mẫu:', err)
    });
  }

  getFileIconClass(type: string): string {
    if (!type) return '';
    const t = type.toLowerCase();
    if (t.includes('doc')) return 'word';
    if (t.includes('xls') || t.includes('sheet')) return 'excel';
    if (t.includes('pdf')) return 'pdf';
    return '';
  }

  getDownloadUrl(path: string): string {
    if (!path) return '';
    return `${this.baseUrl}${path}`;
  }

  onFileSelected(event: any) {
    if (!this.canManageDocuments) {
        alert('Bạn không có quyền tải lên biểu mẫu!');
        return;
    }

    const file: File = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name); 
      formData.append('description', 'Biểu mẫu công ty');

      this.tplService.upload(formData).subscribe({
        next: () => {
          this.loadTemplates();
          alert('Upload biểu mẫu thành công!');
        },
        error: (err) => {
          console.error(err);
          const errorMessage = err.status === 403 ? 'Bạn không có quyền tải lên biểu mẫu!' : (err.error?.message || 'Lỗi khi upload!');
          alert(errorMessage);
        }
      });
    }
  }

  deleteTemplate(id: number) {
    if (!this.canManageDocuments) {
        alert('Bạn không có quyền xóa biểu mẫu!');
        return;
    }

    if(confirm('Bạn có chắc chắn muốn xóa biểu mẫu này không?')) {
        this.tplService.delete(id).subscribe({
            next: () => {
                this.loadTemplates();
                alert('Đã xóa thành công.');
            },
            error: (err) => {
                console.error(err);
                const errorMessage = err.status === 403 ? 'Bạn không có quyền xóa biểu mẫu!' : (err.error?.message || 'Có lỗi khi xóa.');
                alert(errorMessage);
            }
        });
    }
  }
}