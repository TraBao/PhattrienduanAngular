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
        const token = localStorage.getItem('jwtToken'); 
        this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5195/chatHub', {
            accessTokenFactory: () => token || ''
        })
        .withAutomaticReconnect()
        .build();

        this.hubConnection.start()
        .then(() => {
            console.log('✅ SignalR Connected!');
        })
        .catch(err => console.error('❌ Error while starting SignalR connection: ' + err));

        this.hubConnection.on('ReceiveMessage', (user, message, time, receiver) => {
        this.messageReceived.next({ user, message, time, receiver });
        });
    }

    public joinGroup(groupName: string) {
        if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
        this.hubConnection.invoke('JoinGroup', groupName)
            .catch(err => console.error(err));
        } else {
        setTimeout(() => this.joinGroup(groupName), 1000);
        }
    }

    public sendMessage(user: string, message: string, receiver: string | null = null) {
        this.hubConnection.invoke('SendMessage', user, message, receiver)
        .catch(err => console.error(err));
    }

    getChatHistory(receiver: string | null = null): Observable<any[]> {
        const url = receiver ? `${this.apiUrl}/history?receiver=${receiver}` : `${this.apiUrl}/history`;
        return this.http.get<any[]>(url);
    }
    }