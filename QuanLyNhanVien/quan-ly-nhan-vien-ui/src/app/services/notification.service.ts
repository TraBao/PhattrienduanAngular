import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as signalR from '@microsoft/signalr';
import { UserService } from './user.service';

export interface Notification {
  id: number;
  userId: string;
  type: string;
  message: string;
  link: string | null;
  createdAt: string;
  isRead: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {

  private hubConnection!: signalR.HubConnection;
  private apiUrl = 'http://localhost:8080/api/notifications';
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();
  private hasNewNotificationSubject = new BehaviorSubject<boolean>(false);
  hasNewNotification$ = this.hasNewNotificationSubject.asObservable();

  private isConnected = false;
  private isConnecting = false;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private userService: UserService
  ) {
    this.userService.currentUser$.subscribe(user => {
      if (user?.token) {
        this.init();
      } else {
        this.stop();
        this.resetState();
      }
    });
  }
  init(): void {
    const user = this.userService.getCurrentUser();
    if (!user?.token) return;
    if (this.isConnected || this.isConnecting) return;

    this.startConnection(user.token);
  }

  stop(): void {
    if (this.hubConnection && this.isConnected) {
      this.hubConnection.stop();
      this.isConnected = false;
      console.log('NotificationHub stopped');
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private resetState(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
    this.hasNewNotificationSubject.next(false);
  }

  // =========================
  // SIGNALR
  // =========================
  private startConnection(token: string): void {
    this.isConnecting = true;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:8080/notificationhub', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('NotificationHub connected');
        this.isConnected = true;
        this.isConnecting = false;
        this.registerListeners();
        this.loadInitialNotifications();
      })
      .catch(err => {
        this.isConnecting = false;
        console.error('SignalR error:', err);
      });
  }

  private registerListeners(): void {
    this.hubConnection.on('ReceiveNotification', (notification: Notification) => {
      const current = this.notificationsSubject.getValue();

      this.notificationsSubject.next([notification, ...current]);
      this.unreadCountSubject.next(this.unreadCountSubject.getValue() + 1);
      this.hasNewNotificationSubject.next(true);

      this.snackBar.open(notification.message, 'Đóng', {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'bottom'
      });
    });
  }
  private loadInitialNotifications(): void {
    const token = this.userService.getToken();
    if (!token) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http
      .get<{ items: Notification[]; unreadCount: number }>(this.apiUrl, { headers })
      .subscribe({
        next: res => {
          this.notificationsSubject.next(res.items);
          this.unreadCountSubject.next(res.unreadCount);
          this.hasNewNotificationSubject.next(res.unreadCount > 0);
        },
        error: err => console.error('Load notification error', err)
      });
  }

  markAsRead(id: number): Observable<any> {
    const token = this.userService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const list = this.notificationsSubject.getValue();
    const noti = list.find(n => n.id === id);

    if (noti && !noti.isRead) {
      noti.isRead = true;
      this.notificationsSubject.next([...list]);
      this.unreadCountSubject.next(
        Math.max(0, this.unreadCountSubject.getValue() - 1)
      );
    }

    if (this.unreadCountSubject.getValue() === 0) {
      this.hasNewNotificationSubject.next(false);
    }

    return this.http.post(
      `${this.apiUrl}/mark-as-read/${id}`,
      {},
      { headers }
    );
  }

  markAllAsRead(): void {
    const token = this.userService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const updated = this.notificationsSubject.getValue().map(n => ({
      ...n,
      isRead: true
    }));

    this.notificationsSubject.next(updated);
    this.unreadCountSubject.next(0);
    this.hasNewNotificationSubject.next(false);

    this.http
      .post(`${this.apiUrl}/mark-all-as-read`, {}, { headers })
      .subscribe();
  }
  clearNewFlag(): void {
    this.hasNewNotificationSubject.next(false);
  }
}
