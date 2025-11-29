import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; 
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from './services/user.service';
import { AuthApiService } from './services/auth-api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { Observable } from 'rxjs';
import { User } from './models/auth/user.model';
import { ThemeService } from './services/theme.service';
import { MatDividerModule } from '@angular/material/divider';
import { MaterialModule } from './material-module';
import { ChatService } from './services/chat.service';
import { ChatWidgetComponent } from './components/chat-widget/chat-widget';
import { AiWidgetComponent } from './components/ai-widget/ai-widget';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    MatMenuModule,
    MaterialModule,
    MatDividerModule,
    RouterLinkActive,
    RouterLink,
    ChatWidgetComponent,
    AiWidgetComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  currentUser$: Observable<User | null> = new Observable<User | null>();

  constructor(
    public userService: UserService,
    public themeService: ThemeService,
    private authApiService: AuthApiService,
    private router: Router,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.userService.currentUser$;
  }
isCurrentUserAdmin(): boolean {
  const user = this.userService.getCurrentUserValue();
  return user ? user.roles.some((r: string) => r.toLowerCase() === 'admin') : false;
}

  logout(): void {
    this.authApiService.logout();
    this.router.navigate(['/login']);
  }
}