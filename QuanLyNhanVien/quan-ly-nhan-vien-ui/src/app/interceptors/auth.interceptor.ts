import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { UserService } from '../services/user.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(private userService: UserService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req.headers.has('Authorization')) {
            return next.handle(req);
        }

        return this.userService.currentUser$.pipe(
            take(1), 
            switchMap(user => {
                if (req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register')) {
                    return next.handle(req);
                }

                if (user && user.token) {
                    const cloned = req.clone({
                        headers: req.headers.set('Authorization', `Bearer ${user.token}`)
                    });
                    return next.handle(cloned);
                }

                return next.handle(req);
            })
        );
    }
}