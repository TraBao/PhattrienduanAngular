import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserService } from '../services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const requiredPermission = route.data['permission'] as string;
    if (!requiredPermission) {
      return true;
    }
    if (this.userService.hasPermission(requiredPermission)) {
      return true;
    } else {
      this.snackBar.open('Bạn không có đủ quyền truy cập tính năng này.', 'Đóng', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      const redirectPath = this.userService.isAdmin() ? '/admin-dashboard' : '/dashboard';
      return this.router.createUrlTree([redirectPath]);
    }
  }
}