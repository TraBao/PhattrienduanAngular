import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserService } from '../services/user.service';

    @Injectable({
    providedIn: 'root'
    })
    export class AuthGuard implements CanActivate {
    constructor(private userService: UserService, private router: Router) {}

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        
        if (this.userService.isLoggedIn()) {
        const userRole = this.userService.getUserRole();
        const expectedRoles = route.data['roles'] as Array<string>;
        if (expectedRoles && expectedRoles.length > 0 && !expectedRoles.includes(userRole)) {
            console.warn("Truy cập bị từ chối: Quyền không hợp lệ");
            this.router.navigate(['/dashboard']);
            return false;
        }
        return true;
        } else {
        return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
        }
    }
    }