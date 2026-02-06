import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subscription } from 'rxjs';
import { MaterialModule } from '../../material-module';
import { ChatWidgetComponent } from '../../components/chat-widget/chat-widget';
import { PolicyDialogComponent } from '../../components/policy-dialog/policy-dialog.component';
import { MatBadgeModule } from '@angular/material/badge';

import { UserService, LoggedInUser } from '../../services/user.service';
import { AuthApiService } from '../../services/auth-api.service';
import { ThemeService } from '../../services/theme.service';
import {
  Notification,
  NotificationService
} from '../../services/notification.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    ChatWidgetComponent,
    MatBadgeModule
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  currentUser$: Observable<LoggedInUser | null>;
  isAdmin = false;
  notifications$!: Observable<Notification[]>;
  unreadCount$!: Observable<number>;
  hasNewNotification$!: Observable<boolean>;

  private subs = new Subscription();

  constructor(
    public userService: UserService,
    public themeService: ThemeService,
    private authApiService: AuthApiService,
    private router: Router,
    private dialog: MatDialog,
    private notificationService: NotificationService
  ) {
    this.currentUser$ = this.userService.currentUser$;
    this.notifications$ = this.notificationService.notifications$;
    this.unreadCount$ = this.notificationService.unreadCount$;
    this.hasNewNotification$ = this.notificationService.hasNewNotification$;
  }
  ngOnInit(): void {
    this.subs.add(
      this.currentUser$.subscribe(user => {
        this.isAdmin = !!user?.roles?.some(
          r => r.toLowerCase() === 'admin'
        );
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
  onOpenNotificationMenu(): void {
    this.notificationService.clearNewFlag();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  markAsReadAndNavigate(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    if (notification.link) {
      this.router.navigate([notification.link]);
    }
  }
  formatTime(dateStr: string): string {
    const now = new Date();
    const pastDate = new Date(dateStr);
    if (isNaN(pastDate.getTime())) return '';

    const diffMs = now.getTime() - pastDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Vừa xong';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return pastDate.toLocaleDateString('vi-VN');
  }

  openPolicyDialog(): void {
    this.dialog.open(PolicyDialogComponent, {
      width: '600px',
      autoFocus: false
    });
  }

  logout(): void {
    this.authApiService.logout();
  }

  hasPerm(code: string): boolean {
    return this.userService.hasPermission(code);
  }

  isCurrentUserAdmin(): boolean {
    return this.isAdmin;
  }
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'Payroll':
        return 'payments';
      case 'Leave':
        return 'event_available';
      case 'Announcement':
        return 'campaign';
      default:
        return 'info';
    }
  }

  getNotificationIconClass(type: string): string {
    switch (type) {
      case 'Payroll':
        return 'salary';
      case 'Leave':
        return 'leave';
      case 'Announcement':
        return 'news';
      default:
        return 'system';
    }
  }
}
