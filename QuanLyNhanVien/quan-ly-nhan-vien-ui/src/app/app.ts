import { Component, OnInit, OnDestroy } from '@angular/core'; // Thêm OnDestroy
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router'; 
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MaterialModule } from './material-module';
import { UserService } from './services/user.service';
import { AuthApiService } from './services/auth-api.service';
import { ThemeService } from './services/theme.service';
import { ChatService } from './services/chat.service';
import { ChatWidgetComponent } from './components/chat-widget/chat-widget';
import { AiWidgetComponent } from './components/ai-widget/ai-widget';
import { PolicyDialogComponent } from './components/policy-dialog/policy-dialog.component'; 
import { User } from './models/auth/user.model';
import { Notification, NotificationService } from './services/notification.service';

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
export class AppComponent implements OnInit, OnDestroy {
  currentUser$: Observable<User | null> = new Observable<User | null>();
  isAdmin: boolean = false;
  notifications: Notification[] = [];
  unreadCount$: Observable<number> = of(0);

  private subs = new Subscription();

  constructor(
    public userService: UserService,
    public themeService: ThemeService,
    private authApiService: AuthApiService,
    private router: Router,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.userService.currentUser$;
    
    this.subs.add(this.currentUser$.subscribe(user => {
      if (user) {
        this.isAdmin = user.roles && user.roles.some(r => r.toLowerCase() === 'admin');
        this.chatService.startConnection().then(() => {
            this.loadNotifications();
        });
      } else {
        this.notifications = [];
        this.unreadCount$ = of(0);
      }
    }));
    this.subs.add(this.notificationService.notifications$.subscribe(notifs => {
        this.notifications = notifs.slice(0, 8);
    }));
    this.unreadCount$ = this.notificationService.getUnreadCount();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe({
      error: (err) => console.error('Lỗi tải thông báo:', err)
    });
  }
  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      error: (err) => console.error('Lỗi đánh dấu tất cả đã đọc:', err)
    });
  }
  markAsRead(notification: Notification) {
    if (!notification.isRead) {
        this.notificationService.markAsRead(notification.id).subscribe({
            next: () => {
            },
            error: (err) => console.error('Lỗi đánh dấu đã đọc:', err)
        });
    }
  }
  formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Vừa xong';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  }

  openPolicyDialog() {
    this.dialog.open(PolicyDialogComponent, { width: '600px', autoFocus: false });
  }
  logout(): void {
    this.authApiService.logout();
    this.router.navigate(['/login']);
  }

  hasPerm(code: string): boolean {
    return this.userService.hasPermission(code);
  }
  
  isCurrentUserAdmin(): boolean {
    return this.isAdmin;
  }
  getNotificationIcon(type: string): string {
    switch (type) {
        case 'Payroll': return 'payments';
        case 'Leave': return 'event_available';
        case 'Announcement': return 'campaign';
        default: return 'info';
    }
  }
  getNotificationIconClass(type: string): string {
    switch (type) {
        case 'Payroll': return 'salary';
        case 'Leave': return 'leave';
        case 'Announcement': return 'news';
        default: return 'system';
    }
  }
}