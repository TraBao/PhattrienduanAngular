import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { DashboardService } from '../../services/dashboard.service';
import { DepartmentService } from '../../services/department.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartType, ChartOptions } from 'chart.js';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MaterialModule, BaseChartDirective, MatProgressSpinnerModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss']
})
export class AdminDashboardComponent implements OnInit {
  currentYear = new Date().getFullYear();
  stats: any = {
    totalEmployees: 0,
    totalSalary: 0,
    pendingLeaves: 0
  };
  
  public chartLoaded = false;
  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'right', 
        labels: { usePointStyle: true, font: { family: "'Inter', sans-serif", size: 12 } } 
      }
    }
  };
  public pieChartType: 'pie' = 'pie';
  public pieChartData: ChartData<'pie'> = { labels: [], datasets: [{ data: [] }] };
  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            // Format số tiền trong tooltip (Ví dụ: 15,000,000 đ)
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#f3f4f6' },
        ticks: { 
          font: { family: "'Inter', sans-serif", size: 11 },
          callback: function(value: any) {
            if (value >= 1000000000) return (value / 1000000000).toFixed(1) + ' Tỷ';
            if (value >= 1000000) return (value / 1000000).toFixed(0) + ' Tr';
            return value;
          }
        }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: "'Inter', sans-serif", size: 11 } }
      }
    }
  };
  public barChartType: 'bar' = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [{ data: [], label: 'Tổng lương', backgroundColor: '#3b82f6', borderRadius: 4, barThickness: 16 }]
  };

  constructor(
    private dashboardService: DashboardService,
    private departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData() {
    forkJoin({
      stats: this.dashboardService.getStats().pipe(catchError(() => of({}))),
      departments: this.departmentService.getAll().pipe(catchError(() => of([]))),
      salaryGrowth: this.dashboardService.getSalaryGrowth(this.currentYear).pipe(
        catchError(() => {
            console.warn('API salary-growth chưa có, đang dùng Mock Data');
            return of(Array(12).fill(0).map(() => Math.floor(Math.random() * 50000000) + 20000000));
        })
      )
    }).subscribe({
      next: (result) => {
        this.stats = result.stats;
        const deptMap = new Map<number, string>();
        if (Array.isArray(result.departments)) {
            result.departments.forEach((d: any) => deptMap.set(d.id, d.name));
        }

        const pieLabels: string[] = [];
        const pieCounts: number[] = [];
        if (this.stats.departmentStats) {
          this.stats.departmentStats.forEach((d: any) => {
            pieLabels.push(deptMap.get(d.departmentId) || `Phòng ${d.departmentId}`);
            pieCounts.push(d.count);
          });
        }
        
        this.pieChartData = {
            labels: pieLabels,
            datasets: [{
                data: pieCounts,
                backgroundColor: ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'],
                hoverOffset: 4,
                borderWidth: 0
            }]
        };
        this.barChartData.datasets[0].data = result.salaryGrowth; 
        const currentMonthIdx = new Date().getMonth(); 
        if(this.stats.totalSalary > 0) {
            this.barChartData.datasets[0].data[currentMonthIdx] = this.stats.totalSalary;
        }

        this.chartLoaded = true;
      },
      error: (err) => {
          console.error(err);
          this.chartLoaded = true;
      }
    });
  }
}