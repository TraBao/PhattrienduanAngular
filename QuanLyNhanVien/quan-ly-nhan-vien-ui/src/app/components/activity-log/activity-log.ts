import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivityService } from '../../services/activity.service';
import { SystemActivity } from '../../models/system-activity.model';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './activity-log.html',
  styleUrls: ['./activity-log.scss']
})
export class ActivityLogComponent implements OnInit {
  displayedColumns: string[] = ['time', 'user', 'method', 'path', 'desc'];
  dataSource = new MatTableDataSource<SystemActivity>();
  totalItems = 0;
  pageSize = 20;
  currentPage = 1;
  searchQuery = '';
  private searchSubject = new Subject<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private activityService: ActivityService) {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery = query;
      this.currentPage = 1;
      this.loadData();
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.activityService.getActivities(this.currentPage, this.pageSize, this.searchQuery)
      .subscribe({
        next: (res) => {
          this.dataSource.data = res.data;
          this.totalItems = res.total;
        },
        error: (err) => console.error('Lỗi tải lịch sử:', err)
      });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }
  getMethodColor(method: string): string {
    switch (method) {
      case 'POST': return 'create-badge';
      case 'PUT': return 'update-badge';
      case 'DELETE': return 'delete-badge';
      default: return 'view-badge';
    }
  }
}