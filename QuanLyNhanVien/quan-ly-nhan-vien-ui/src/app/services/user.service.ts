import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../models/auth/user.model'; 
import { Router } from '@angular/router';
export interface UserInfo {
    id: string;
    email: string;
    fullName?: string;
    roles: string[];
    permissions?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();
    private apiUrl = 'http://localhost:8080/api/auth';
    private currentPermissions: string = '';

    constructor(
        private snackBar: MatSnackBar,
        private http: HttpClient,
        private router: Router
    ) {
        this.loadInitialUser();
    }

    public getCurrentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    getUserRole(): string {
        const user = this.getCurrentUserValue();
        if (user && user.roles && user.roles.length > 0) {
            return user.roles[0];
        }
        return '';
    }

    setCurrentUser(user: User): void {
        if (user && user.token) {
            localStorage.setItem('jwtToken', user.token);
            this.loadInitialUser(); 
        } else {
            this.currentUserSubject.next(user);
        }
    }

    removeCurrentUser(): void {
        localStorage.removeItem('jwtToken');
        this.currentUserSubject.next(null);
        this.currentPermissions = '';
        this.snackBar.open('Đã đăng xuất thành công.', 'Đóng', { duration: 2000 });
        this.router.navigate(['/login']);
    }
    isAdmin(): boolean {
        const user = this.currentUserSubject.value;
        return user ? user.roles.some((r: string) => r.toLowerCase() === 'admin') : false;
    }

    isUser(): boolean {
        const user = this.currentUserSubject.value;
        return user ? user.roles.some((r: string) => r.toLowerCase() === 'user') : false;
    }
    hasPermission(permissionCode: string): boolean {
        if (this.isAdmin()) return true;
        if (!this.currentUserSubject.value) return false;
        return this.currentPermissions.includes(permissionCode);
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
    updatePermissions(userId: string, permissions: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${userId}/permissions`, { permissions });
    }

    deleteUser(email: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/users/${email}`);
    }
    private decodeToken(token: string): any {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Lỗi giải mã Token:", e);
            return null;
        }
    }

    private loadInitialUser(): void {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            const decoded = this.decodeToken(token);
            
            if (decoded) {
                if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                    this.removeCurrentUser();
                    return;
                }
                const email = decoded['email'] || 
                              decoded['unique_name'] || 
                              decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 
                              decoded['sub'];
                let roles: string[] = [];
                const roleClaim = decoded['role'] || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
                
                if (Array.isArray(roleClaim)) {
                    roles = roleClaim;
                } else if (roleClaim) {
                    roles = [roleClaim];
                }
                this.currentPermissions = decoded['permissions'] || '';
                const user: User = { 
                    id: decoded['id'] || 0,
                    username: email,
                    email: email,
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