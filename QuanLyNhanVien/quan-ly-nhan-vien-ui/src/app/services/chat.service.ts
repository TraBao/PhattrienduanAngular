    import { Injectable } from '@angular/core';
    import * as signalR from '@microsoft/signalr';
    import { BehaviorSubject, Observable } from 'rxjs';
    import { HttpClient } from '@angular/common/http';

    @Injectable({ providedIn: 'root' })
    export class ChatService {
    private hubConnection!: signalR.HubConnection;
    public messageReceived = new BehaviorSubject<any>(null);
    private apiUrl = 'http://localhost:5195/api/chat';

    constructor(private http: HttpClient) {
        this.startConnection();
    }

    public startConnection() {
        this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5195/chatHub')
        .withAutomaticReconnect()
        .build();

        this.hubConnection.start()
        .then(() => console.log('✅ SignalR Connected!'))
        .catch(err => console.log('❌ SignalR Error: ' + err));
        this.hubConnection.on('ReceiveMessage', (user, message, time) => {
        this.messageReceived.next({ user, message, time });
        });
    }
    public sendMessage(user: string, message: string) {
        this.hubConnection.invoke('SendMessage', user, message)
        .catch(err => console.error(err));
    }
    getChatHistory(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/history`);
    }
    }