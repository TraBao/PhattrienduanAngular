import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { DashboardService } from '../../services/dashboard.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartType, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MaterialModule, BaseChartDirective],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss']
})
export class AdminDashboardComponent implements OnInit {
  stats: any = {
    totalEmployees: 0,
    totalSalary: 0,
    pendingLeaves: 0
  };
  public pieChartOptions: ChartOptions = { responsive: true };
  public pieChartLabels: string[] = ['Kỹ thuật', 'Nhân sự', 'Kinh doanh', 'Khác'];
  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [ { data: [] } ]
  };
  public chartLoaded = false;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats() {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        const labels: string[] = [];
        const counts: number[] = [];

        data.departmentStats.forEach((d: any) => {
            labels.push(`Phòng ${d.departmentId}`);
            counts.push(d.count);
        });

        this.pieChartData = {
            labels: labels,
            datasets: [{ 
                data: counts,
                backgroundColor: ['#3f51b5', '#ff4081', '#ff9800', '#4caf50']
            }]
        };
        this.chartLoaded = true;
      },
      error: (err) => console.error(err)
    });
  }
}