import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { LoginRequest } from '../models/auth/login-request.model';
import { LoginResponse } from '../models/auth/login-response.model';
import { UserService, LoggedInUser } from './user.service'; 
import { RegisterDto } from '../models/auth/register-request.model';

@Injectable({
    providedIn: 'root'
})
export class AuthApiService {
    private apiUrl = 'http://localhost:8080/api/auth';

    constructor(
        private http: HttpClient,
        private userService: UserService
    ) { }

    register(request: RegisterDto): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, request);
    }
    login(request: LoginRequest): Observable<LoggedInUser> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request)
            .pipe(
                map(response => {
                    localStorage.setItem('jwtToken', response.token);
                    const user = this.decodeToken(response.token);
                    this.userService.setCurrentUser(user);
                    return user;
                })
            );
    }
    
    logout(): void {
        localStorage.removeItem('jwtToken');
        this.userService.removeCurrentUser();
    }

    toggleLock(userId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/toggle-lock/${userId}`, {});
    }
    private decodeToken(token: string): LoggedInUser {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const email = payload.name || payload.email || '';
        const MICROSOFT_ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
        const roleClaim = payload[MICROSOFT_ROLE_CLAIM] || payload.role;
        const roles = roleClaim ? (Array.isArray(roleClaim) ? roleClaim : [roleClaim]) : [];

        return { 
            id: payload.sub || payload.id || '', 
            username: email, 
            email: email, 
            roles: roles, 
            token: token 
        };
    }
}