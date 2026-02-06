import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder, HttpTransportType } from '@microsoft/signalr'; 

export enum MessageType {
  General = 0,
  Department = 1,
  Private = 2
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private hubConnection: signalR.HubConnection | null = null;
  
  public messageReceived = new BehaviorSubject<any>(null);
  public reactionReceived = new BehaviorSubject<any>(null);
  public notificationReceived = new BehaviorSubject<any>(null); 
  private apiUrl = 'http://localhost:8080/api/chat';

  constructor(private http: HttpClient) {
  }
  public async startConnection(): Promise<void> {
    const token = localStorage.getItem('jwtToken');

    if (this.hubConnection) {
        try {
            await this.hubConnection.stop();
            console.log('🛑 Đã ngắt kết nối SignalR cũ để làm mới phiên.');
        } catch (e) {
            console.warn('⚠️ Lỗi khi ngắt kết nối cũ (có thể bỏ qua):', e);
        }
    }
    this.hubConnection = new signalR.HubConnectionBuilder()
  .withUrl('http://localhost:8080/chatHub', {
    skipNegotiation: true,
    transport: signalR.HttpTransportType.WebSockets,
    accessTokenFactory: () => {
        return localStorage.getItem('jwtToken') || '';
    }
  })
  .withAutomaticReconnect()
  .build();
    this.hubConnection.on('ReceiveMessage', (user, message, time, receiver, type) => {
      this.messageReceived.next({ user, message, time, receiver, type });
    });

    this.hubConnection.on('ReceiveReaction', (messageId, emoji, userEmail) => {
      this.reactionReceived.next({ messageId, emoji, userEmail });
    });
    this.hubConnection.on('ReceiveNotification', (notification) => {
        console.log('🔔 Notification Real-time Received:', notification);
        this.notificationReceived.next(notification);
    });
    try {
        await this.hubConnection.start();
        console.log('✅ Chat SignalR Connected (Session mới)!');
    } catch (err) {
        console.error('❌ SignalR Connection Error: ' + err);
    }
  }

  public joinGeneralChat() {
    this.invokeJoinRoom('General');
  }

  public joinDepartmentChat(deptId: any) {
    this.invokeJoinRoom(`Dept_${deptId}`);
  }

  private invokeJoinRoom(roomName: string) {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      console.log(`🔄 Joining Room: ${roomName}`);
      this.hubConnection.invoke('JoinChatRoom', roomName)
        .catch(err => console.error('Error joining room:', err));
    } else {
      console.warn('⚠️ Connection not ready, retrying in 1s...');
      setTimeout(() => this.invokeJoinRoom(roomName), 1000);
    }
  }

  public async sendMessage(content: string, receiverId: string | null, type: MessageType) {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('SendMessage', content, receiverId, type)
        .catch(err => console.error("❌ Error sending message:", err));
    }
    return Promise.reject("Connection not established");
  }

  public sendReaction(messageId: number, emoji: string) {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
        const userEmail = this.getUserEmailFromToken(); 
        this.hubConnection.invoke('SendReaction', messageId, emoji, userEmail)
            .catch(err => console.error("❌ Error sending reaction:", err));
    }
  }
  getChatHistory(receiverId: string | null, type: MessageType): Observable<any[]> {
    let params = new HttpParams().set('type', type.toString());
    
    if (receiverId) {
        params = params.set('receiverId', receiverId);
    }

    return this.http.get<any[]>(`${this.apiUrl}/history`, { params });
  }
  public getUserEmailFromToken(): string {
    const token = localStorage.getItem('jwtToken');
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email || 
             payload.unique_name || 
             payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 
             payload.sub || '';
    } catch (e) {
      return '';
    }
  }
}