
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    
    console.log(`[AuthGuard] Đang kiểm tra route: ${state.url}`);

    return this.userService.currentUser$.pipe(
      take(1),
      map(user => {
        console.log('[AuthGuard] Giá trị User nhận được:', user);

        if (user) {
          console.log('[AuthGuard] User đã đăng nhập. Bắt đầu kiểm tra role (nếu có).');
          
          const expectedRoles = route.data['roles'] as Array<string>;
          console.log('[AuthGuard] Route yêu cầu roles:', expectedRoles);

          if (expectedRoles && expectedRoles.length > 0) {
              const hasRole = expectedRoles.some(role => user.roles.includes(role));
              console.log(`[AuthGuard] User có roles: [${user.roles.join(', ')}]. Có khớp yêu cầu không? -> ${hasRole}`); 
              
              if (hasRole) {
                  console.log('[AuthGuard] QUYẾT ĐỊNH: CHO PHÉP (Role hợp lệ).');
                  return true;
              } else {
                  console.warn("[AuthGuard] QUYẾT ĐỊNH: TỪ CHỐI (Role không hợp lệ). Chuyển hướng về /dashboard.");
                  return this.router.createUrlTree(['/dashboard']);
              }
          }
          
          console.log('[AuthGuard] QUYẾT ĐỊNH: CHO PHÉP (Route không yêu cầu role).');
          return true;
        } else {
          console.warn(`[AuthGuard] QUYẾT ĐỊNH: TỪ CHỐI (Chưa đăng nhập). Chuyển hướng về /login.`);
          return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
        }
      })
    );
  }
}