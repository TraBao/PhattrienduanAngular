    import { Injectable } from '@angular/core';
    import { HttpClient } from '@angular/common/http';
    import { Observable } from 'rxjs';

    export interface Announcement {
    id: number;
    title: string;
    content: string;
    isImportant: boolean;
    createdAt: string;
    }

    @Injectable({
    providedIn: 'root'
    })
    export class AnnouncementService {
    private apiUrl = 'http://localhost:5195/api/Announcements';

    constructor(private http: HttpClient) { }

    getAll(): Observable<Announcement[]> {
        return this.http.get<Announcement[]>(this.apiUrl);
    }

    create(data: any): Observable<any> {
        return this.http.post(this.apiUrl, data);
    }

    delete(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
    }