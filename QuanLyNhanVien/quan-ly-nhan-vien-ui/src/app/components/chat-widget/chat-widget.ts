import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material-module';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, MatTooltipModule],
  templateUrl: './chat-widget.html',
  styleUrls: ['./chat-widget.scss']
})
export class ChatWidgetComponent implements OnInit, AfterViewChecked {
  isOpen = false;
  txtMessage = '';
  messages: any[] = [];
  currentUser = '';

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor(
    private chatService: ChatService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.identifyUser();
    this.userService.currentUser$.subscribe(user => {
      if (user && user.email) {
        this.currentUser = user.email;
      }
    });
    this.chatService.getChatHistory().subscribe({
      next: (history) => {
        this.messages = history;
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });

    this.chatService.messageReceived.subscribe((msg: any) => {
      if (msg) {
        this.messages.push(msg);
        this.scrollToBottom();
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) setTimeout(() => this.scrollToBottom(), 100);
  }

  identifyUser() {
    const u = this.userService.getCurrentUserValue();
    if (u && u.email) {
      this.currentUser = u.email;
      console.log('✅ Lấy user từ Service:', this.currentUser);
      return;
    }
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const decoded = this.parseJwt(token);
      if (decoded) {
        this.currentUser =  decoded['email'] ||
                            decoded['unique_name'] ||
                            decoded['sub'] ||
                            decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 
                            decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
        
        console.log('✅ Đã giải mã Token lấy được Email:', this.currentUser);
      }
    }
  }
  parseJwt(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  sendMessage() {
    if (!this.currentUser) this.identifyUser();

    if (this.txtMessage.trim() && this.currentUser) {
      this.chatService.sendMessage(this.currentUser, this.txtMessage);
      this.txtMessage = '';
    } else {
      console.error('Lỗi: Không tìm thấy thông tin User trong Token.');
      alert('Lỗi: Vui lòng đăng nhập lại.');
    }
  }
}