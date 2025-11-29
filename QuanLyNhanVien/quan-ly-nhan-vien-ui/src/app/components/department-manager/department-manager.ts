import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material-module';
import { DepartmentService } from '../../services/department.service';
import { Department } from '../../models/department.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-department-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './department-manager.html',
  styleUrls: ['./department-manager.scss']
})
export class DepartmentManagerComponent implements OnInit {
  departments: Department[] = [];
  displayedColumns: string[] = ['id', 'name', 'description', 'actions'];
  deptForm: any = { name: '', description: '' };
  isEditMode = false;
  editingId: number | null = null;

  constructor(
    private deptService: DepartmentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.deptService.getAll().subscribe({
        next: (data) => this.departments = data,
        error: (err) => console.error(err)
    });
  }

  saveDepartment() {
    if (this.isEditMode && this.editingId) {
        const updateData = { ...this.deptForm, id: this.editingId };
        this.deptService.update(this.editingId, updateData).subscribe({
            next: () => {
                this.snackBar.open('Đã cập nhật phòng ban!', 'Đóng', { duration: 3000, panelClass: ['success-snackbar'] });
                this.resetForm();
                this.loadData();
            },
            error: () => this.snackBar.open('Lỗi khi cập nhật', 'Đóng', { duration: 3000 })
        });
    } else {
        this.deptService.create(this.deptForm).subscribe({
            next: () => {
                this.snackBar.open('Thêm phòng ban thành công!', 'Đóng', { duration: 3000, panelClass: ['success-snackbar'] });
                this.resetForm();
                this.loadData();
            },
            error: () => this.snackBar.open('Lỗi khi thêm mới', 'Đóng', { duration: 3000 })
        });
    }
  }

  editDept(dept: Department) {
      this.isEditMode = true;
      this.editingId = dept.id;
      this.deptForm = { name: dept.name, description: dept.description };
  }

  deleteDept(id: number) {
      if(confirm('Bạn có chắc muốn xóa phòng ban này?')) {
          this.deptService.delete(id).subscribe({
              next: () => {
                  this.snackBar.open('Đã xóa phòng ban.', 'Đóng', { duration: 3000 });
                  this.loadData();
              },
              error: (err) => {
                  const msg = err.error?.message || 'Không thể xóa phòng ban này.';
                  this.snackBar.open(msg, 'Đóng', { duration: 5000 });
              }
          });
      }
  }

  resetForm() {
      this.isEditMode = false;
      this.editingId = null;
      this.deptForm = { name: '', description: '' };
  }
}