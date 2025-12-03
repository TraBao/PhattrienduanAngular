import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router'; 
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MaterialModule } from './material-module';
import { UserService } from './services/user.service';
import { AuthApiService } from './services/auth-api.service';
import { ThemeService } from './services/theme.service';
import { ChatService } from './services/chat.service';
import { ChatWidgetComponent } from './components/chat-widget/chat-widget';
import { AiWidgetComponent } from './components/ai-widget/ai-widget';
import { PolicyDialogComponent } from './components/policy-dialog/policy-dialog.component'; 
import { AnnouncementService } from './services/announcement.service';
import { PayrollService } from './services/payroll.service';
import { LeaveService } from './services/leave.service';
import { User } from './models/auth/user.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, MatToolbarModule, MatIconModule, MatButtonModule, CommonModule,
    MatMenuModule, MaterialModule, MatDividerModule, RouterLinkActive, RouterLink,
    ChatWidgetComponent, AiWidgetComponent, PolicyDialogComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  currentUser$: Observable<User | null> = new Observable<User | null>();
  isAdmin: boolean = false;
  notifications: any[] = [];

  constructor(
    public userService: UserService,
    public themeService: ThemeService,
    private authApiService: AuthApiService,
    private router: Router,
    private dialog: MatDialog,
    private announcementService: AnnouncementService,
    private payrollService: PayrollService,
    private leaveService: LeaveService
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.userService.currentUser$;
    this.currentUser$.subscribe(user => {
      if (user) {
        this.isAdmin = user.roles && user.roles.some(r => r.toLowerCase() === 'admin');
        this.loadCombinedNotifications(this.isAdmin);
      } else {
        this.notifications = [];
      }
    });
  }
  loadCombinedNotifications(isAdmin: boolean) {
    const news$ = this.announcementService.getAll().pipe(
      map(data => data
        .filter((n: any) => n.isImportant)
        .map((n: any) => ({
          type: 'news',
          title: n.title,
          message: n.content.length > 60 ? n.content.substring(0, 60) + '...' : n.content,
          date: new Date(n.createdAt),
          timeDisplay: this.formatTime(n.createdAt),
          read: false
        }))
      ),
      catchError(() => of([]))
    );
    let requests: any = { news: news$ };

    if (!isAdmin) {
      const salary$ = this.payrollService.getMyPayslips().pipe(
        map(data => data
          .filter((p: any) => p.status === 'Paid')
          .map((p: any) => ({
            type: 'salary',
            title: `Lương tháng ${p.month} đã về!`,
            message: `Thực nhận: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.finalSalary)}`,
            date: new Date(p.year, p.month - 1, 25),
            timeDisplay: p.paymentDate ? this.formatTime(p.paymentDate) : `Tháng ${p.month}/${p.year}`,
            read: false
          }))
        ),
        catchError(() => of([]))
      );
      const leave$ = this.leaveService.getMyLeaves().pipe(
        map(data => data
          .filter((l: any) => l.status !== 'Pending')
          .map((l: any) => ({
            type: 'leave',
            title: l.status === 'Approved' ? 'Đơn nghỉ được duyệt ✅' : 'Đơn nghỉ bị từ chối ❌',
            message: `Lý do: ${l.reason} (${new Date(l.startDate).getDate()}/${new Date(l.startDate).getMonth() + 1})`,
            date: new Date(l.startDate),
            timeDisplay: this.formatTime(l.startDate),
            read: false
          }))
        ),
        catchError(() => of([]))
      );

      requests.salary = salary$;
      requests.leave = leave$;
    }
    forkJoin(requests).subscribe((res: any) => {
      let combined = [...res.news];
      
      if (!isAdmin) {
        combined = [...combined, ...(res.salary || []), ...(res.leave || [])];
      }
      this.notifications = combined
        .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
        .slice(0, 8);
    });
  }
  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.abs(now.getTime() - date.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      if(hours === 0) return 'Vừa xong';
      return `${hours} giờ trước`;
    }
    return date.toLocaleDateString('vi-VN');
  }

  openPolicyDialog() {
    this.dialog.open(PolicyDialogComponent, { width: '600px', autoFocus: false });
  }

  get unreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
  }

  logout(): void {
    this.authApiService.logout();
    this.router.navigate(['/login']);
  }
  isCurrentUserAdmin(): boolean {
    return this.isAdmin;
}
}