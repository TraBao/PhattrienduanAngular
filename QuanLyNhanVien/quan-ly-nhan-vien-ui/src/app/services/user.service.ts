import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
export interface LoggedInUser {
    id: string;
    username: string;
    email: string;
    roles: string[];
    token: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private currentUserSubject = new BehaviorSubject<LoggedInUser | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();
    private apiUrl = 'https://localhost:7132/api/auth';

    constructor(
        private snackBar: MatSnackBar,
        private http: HttpClient,
        private router: Router
    ) {
        this.loadInitialUser();
    }

    public getCurrentUserValue(): LoggedInUser | null {
        return this.currentUserSubject.value;
    }
    setCurrentUser(user: LoggedInUser): void {
        this.currentUserSubject.next(user);
        
        if (user && user.token) {
            localStorage.setItem('jwtToken', user.token);
        } else {
            localStorage.removeItem('jwtToken');
        }
    }

    removeCurrentUser(): void {
        localStorage.removeItem('jwtToken');
        this.currentUserSubject.next(null);
        this.snackBar.open('Đã đăng xuất thành công.', 'Đóng', { duration: 2000 });
        this.router.navigate(['/login']);
    }


    isAdmin(): boolean {
        const user = this.currentUserSubject.value;
        return user ? user.roles.some((r: string) => r === 'Admin') : false;
    }

    hasPermission(permissionCode: string): boolean {
        if (this.isAdmin()) return true;
        const user = this.currentUserSubject.value;
        if (!user) return false;
        const decoded = this.decodeToken(user.token);
        const permissions = decoded?.permissions || '';
        return permissions.includes(permissionCode);
    }
    isLoggedIn(): boolean {
        return this.currentUserSubject.value !== null;
    }
    getAllUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/users`);
    }

    updateUserRole(email: string, roles: string[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/assign-role`, { email, roles });
    }
    
    updatePermissions(userId: string, permissions: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${userId}/permissions`, { permissions });
    }
    toggleLock(userId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/toggle-lock/${userId}`, {});
    }
    getUserRole(): string {
        const user = this.getCurrentUserValue();
        if (user && user.roles && user.roles.length > 0) {
            return user.roles.includes('Admin') ? 'Admin' : user.roles[0];
        }
        return '';
    }
    private decodeToken(token: string): any {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload;
        } catch (e) { 
            console.error("Lỗi giải mã token:", e);
            return null; 
        }
    }

    private loadInitialUser(): void {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            const decoded = this.decodeToken(token);
            if (decoded) {
                const MICROSOFT_ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
                const roleClaim = decoded[MICROSOFT_ROLE_CLAIM] || decoded.role || [];
                const roles = Array.isArray(roleClaim) ? roleClaim : [roleClaim];

                const user: LoggedInUser = { 
                    id: decoded.sub || decoded.nameid,
                    username: decoded.name || decoded.email,
                    email: decoded.name || decoded.email,
                    roles: roles,
                    token: token
                };
                this.currentUserSubject.next(user);
            } else {
                this.removeCurrentUser();
            }
        }
    }
}