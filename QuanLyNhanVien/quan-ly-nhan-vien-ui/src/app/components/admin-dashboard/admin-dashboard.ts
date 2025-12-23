import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { DashboardService } from '../../services/dashboard.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { forkJoin } from 'rxjs';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    BaseChartDirective,
    RouterModule
  ],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss']
})
export class AdminDashboardComponent implements OnInit {
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  today = new Date();
  stats: any = {
    totalEmployees: 0,
    totalSalary: 0,
    pendingLeaves: 0,
    attendanceToday: {
        present: 0,
        late: 0,
        absent: 0
    },
    departmentStats: []
  };
  
  chartLoaded = false;
  public pieChartData: ChartData<'pie'> = { labels: [], datasets: [{ data: [] }] };
  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };
  public barChartData: ChartData<'bar'> = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [{
        data: [],
        label: 'Quỹ lương (VNĐ)',
        backgroundColor: '#3f51b5',
        borderRadius: 4
    }]
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.chartLoaded = false;
    forkJoin({
      statsResponse: this.dashboardService.getStats(),
      growth: this.dashboardService.getSalaryGrowth(this.currentYear)
    }).subscribe({
      next: (res: any) => {
        this.stats = res.statsResponse.stats ? res.statsResponse.stats : res.statsResponse;
        
        console.log("Dữ liệu stats nhận được:", this.stats);
        if (this.stats && this.stats.departmentStats) {
          this.pieChartData = {
            labels: this.stats.departmentStats.map((d: any) => d.name || d.departmentId),
            datasets: [{
              data: this.stats.departmentStats.map((d: any) => d.count),
              backgroundColor: ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#6366f1']
            }]
          };
        }

        if (res.growth) {
          this.barChartData.datasets[0].data = res.growth;
        }

        this.chartLoaded = true;
      },
      error: (err) => {
        console.error("Lỗi tải Dashboard:", err);
        this.chartLoaded = true;
      }
    });
  }
}