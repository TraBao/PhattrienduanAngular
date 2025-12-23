import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, filter, map } from 'rxjs/operators';
import { ChatService } from './chat.service';
export interface Notification {
  id: number;
  recipientIdentifier: string;
  type: 'Payroll' | 'Leave' | 'Announcement' | 'System';
  title: string;
  message?: string;
  createdAt: Date;
  isRead: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8080/api/notifications';
  private _notifications = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this._notifications.asObservable();
  private _newNotificationReceived = new BehaviorSubject<Notification | null>(null);
  public newNotificationReceived$ = this._newNotificationReceived.asObservable();


  constructor(
    private http: HttpClient,
    private chatService: ChatService
  ) {
    this.chatService.notificationReceived
      .pipe(filter(notification => !!notification))
      .subscribe(notification => {
        const receivedNotification: Notification = {
            ...notification,
            createdAt: new Date(notification.createdAt) 
        };
        const currentNotifications = this._notifications.value;
        const newNotifications = [receivedNotification, ...currentNotifications]
            .sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()); 
        this._notifications.next(newNotifications);
        this._newNotificationReceived.next(receivedNotification);
      });
  }
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl)
      .pipe(
        tap(data => {
          const formattedData = data.map(n => ({
            ...n,
            createdAt: new Date(n.createdAt)
          })).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()); 
          this._notifications.next(formattedData);
        })
      );
  }
  markAsRead(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/mark-read/${id}`, {}).pipe(
        tap(() => {
            const updatedNotifications = this._notifications.value.map(n => 
                n.id === id ? { ...n, isRead: true } : n
            );
            this._notifications.next(updatedNotifications);
        })
    );
  }
  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/mark-all-read`, {})
      .pipe(
        tap(() => {
          const updatedNotifications = this._notifications.value.map(n => ({
            ...n,
            isRead: true
          }));
          this._notifications.next(updatedNotifications);
        })
      );
  }
  getUnreadCount(): Observable<number> {
    return this.notifications$.pipe(
      map((notifications: Notification[]) => notifications.filter(n => !n.isRead).length)
    );
  }
}