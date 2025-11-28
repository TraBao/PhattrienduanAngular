import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { DocumentService } from '../../services/document.service';
import { EmployeeDocument } from '../../models/document.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-employee-docs',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './employee-docs.html',
  styleUrls: ['./employee-docs.scss']
})
export class EmployeeDocsComponent implements OnInit, OnChanges {
  @Input() employeeId!: number;
  dataSource = new MatTableDataSource<EmployeeDocument>();
  displayedColumns: string[] = ['fileName', 'fileSize', 'uploadedAt', 'actions'];
  
  selectedFile: File | null = null;
  isUploading = false;

  constructor(
    private documentService: DocumentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.employeeId) {
      this.loadDocuments();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employeeId'] && this.employeeId) {
      this.loadDocuments();
    }
  }

  loadDocuments() {
    this.documentService.getDocuments(this.employeeId).subscribe({
      next: (data) => this.dataSource.data = data,
      error: () => console.error('Lỗi tải danh sách file')
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  upload() {
    if (!this.selectedFile || !this.employeeId) return;

    this.isUploading = true;
    this.documentService.uploadFile(this.employeeId, this.selectedFile).subscribe({
      next: () => {
        this.snackBar.open('Upload thành công!', 'Đóng', { duration: 3000, panelClass: 'success-snackbar' });
        this.selectedFile = null;
        this.isUploading = false;
        this.loadDocuments();
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
      },
      error: (err) => {
        this.snackBar.open('Lỗi Upload file', 'Đóng', { duration: 3000 });
        this.isUploading = false;
      }
    });
  }
  download(doc: EmployeeDocument) {
    this.documentService.downloadFile(doc.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = doc.fileName;
      anchor.click();
      window.URL.revokeObjectURL(url);
    });
  }

  delete(id: number) {
    if(confirm('Bạn có chắc muốn xóa file này?')) {
      this.documentService.deleteFile(id).subscribe(() => {
        this.snackBar.open('Đã xóa file', 'Đóng', { duration: 2000 });
        this.loadDocuments();
      });
    }
  }

  // Tiện ích: Đổi bytes sang KB/MB
  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}