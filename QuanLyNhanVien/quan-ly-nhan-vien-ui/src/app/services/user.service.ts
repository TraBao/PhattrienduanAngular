import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../models/auth/user.model'; 

export interface UserInfo {
    id: string;
    email: string;
    fullName?: string;
    roles: string[];
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();
    private apiUrl = 'http://localhost:5195/api/auth';

    constructor(
        private snackBar: MatSnackBar,
        private http: HttpClient
    ) {
        this.loadInitialUser();
    }

    public getCurrentUserValue(): User | null {
        return this.currentUserSubject.getValue();
    }

    setCurrentUser(user: User): void {
        this.currentUserSubject.next(user);
    }

    removeCurrentUser(): void {
        this.currentUserSubject.next(null);
        this.snackBar.open('Đã đăng xuất.', 'Đóng', { duration: 2000 });
    }

    isAdmin(): boolean {
        const user = this.currentUserSubject.value;
        // THÊM KIỂU DỮ LIỆU (r: string) VÀO ĐÂY
        return user ? user.roles.some((r: string) => r.toLowerCase() === 'admin') : false;
    }

    isUser(): boolean {
        const user = this.currentUserSubject.value;
        // THÊM KIỂU DỮ LIỆU (r: string) VÀO ĐÂY
        return user ? user.roles.some((r: string) => r.toLowerCase() === 'user') : false;
    }

    isLoggedIn(): boolean {
        return this.currentUserSubject.value !== null;
    }

    getAllUsers(): Observable<UserInfo[]> {
        return this.http.get<UserInfo[]>(`${this.apiUrl}/users`);
    }

    updateUserRole(email: string, roles: string[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/assign-role`, { email, roles });
    }

    deleteUser(email: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/users/${email}`);
    }

    private loadInitialUser(): void {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const email = payload.name;
                const roles = payload.role ? (Array.isArray(payload.role) ? payload.role : [payload.role]) : [];

                const user: User = { email, roles, token };
                this.setCurrentUser(user);
            } catch (e) {
                console.error("JWT Decode Error", e);
                localStorage.removeItem('jwtToken');
            }
        }
    }
}