import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material-module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { EmployeeService } from '../../services/employee';
import { DepartmentService } from '../../services/department.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MaterialModule, 
    MatTooltipModule, 
    MatSelectModule
  ],
  templateUrl: './chat-widget.html',
  styleUrls: ['./chat-widget.scss']
})
export class ChatWidgetComponent implements OnInit, AfterViewChecked, OnDestroy {
  isOpen = false;
  txtMessage = '';
  messages: any[] = [];
  currentUser = '';
  
  activeTab: 'global' | 'dept' = 'global';
  currentViewingDeptId: string | null = null;
  selectedDeptId: number | null = null;
  
  myDeptName: string = '';
  isAdmin: boolean = false;
  departments: any[] = [];
  
  private chatSub!: Subscription;

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private employeeService: EmployeeService,
    private deptService: DepartmentService
  ) {}

  ngOnInit(): void {
    this.identifyUser();
    
    this.chatSub = this.chatService.messageReceived.subscribe((msg: any) => {
      if (msg) {
        this.handleIncomingMessage(msg);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.chatSub) this.chatSub.unsubscribe();
  }

  identifyUser() {
    const u = this.userService.getCurrentUserValue();
    if (u && u.email) {
        this.currentUser = u.email;
        this.isAdmin = u.roles.includes('Admin');
        this.initData();
        return;
    }
    const token = localStorage.getItem('jwtToken');
    if (token) {
        const decoded = this.parseJwt(token);
        if (decoded) {
            console.log('🔍 Decoded Token:', decoded);
            this.currentUser = decoded['email'] || 
                                decoded['unique_name'] || 
                                decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 
                                decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
                                decoded['sub'];
            const roleClaim = decoded['role'] || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            this.isAdmin = Array.isArray(roleClaim) ? roleClaim.includes('Admin') : roleClaim === 'Admin';
            
            console.log('✅ Identified User:', this.currentUser);
            
            if (this.currentUser) {
                this.initData();
            }
        }
    }
  }

  initData() {
    if (this.activeTab === 'global') {
        this.loadHistory(null);
    }

    if (this.isAdmin) {
        this.loadAllDepartments();
    } else {
        this.loadMyDepartment();
    }
  }

  loadAllDepartments() {
    this.deptService.getAll().subscribe(data => {
        this.departments = data || [];
        if (this.departments.length > 0) {
            this.selectedDeptId = this.departments[0].id;
            this.currentViewingDeptId = `Dept_${this.departments[0].id}`;
            this.myDeptName = this.departments[0].name;
            if (this.activeTab === 'dept') {
                this.chatService.joinGroup(this.currentViewingDeptId);
                this.loadHistory(this.currentViewingDeptId);
            }
        }
    });
  }

  onAdminChangeDept(event: MatSelectChange) {
      const deptId = event.value;
      this.selectedDeptId = deptId;
      
      const dept = this.departments.find(d => d.id === deptId);
      if (dept) {
          const groupId = `Dept_${dept.id}`;
          this.currentViewingDeptId = groupId;
          this.myDeptName = dept.name;
          
          this.chatService.joinGroup(groupId);
          this.loadHistory(groupId);
      }
  }

  loadMyDepartment() {
    this.employeeService.getMyProfile().subscribe({
        next: (emp) => {
            if (emp && emp.departmentId) {
                const groupId = `Dept_${emp.departmentId}`;
                this.currentViewingDeptId = groupId;
                this.myDeptName = 'Phòng ban của tôi';
                
                // User thường thì join luôn
                this.chatService.joinGroup(groupId);
            }
        },
        error: () => console.log('Không lấy được thông tin nhân viên')
    });
  }

  switchTab(tab: 'global' | 'dept') {
      this.activeTab = tab;
      
      if (tab === 'dept') {
          if (this.currentViewingDeptId) {
              this.chatService.joinGroup(this.currentViewingDeptId);
              this.loadHistory(this.currentViewingDeptId);
          } else if (this.isAdmin && this.selectedDeptId) {
              this.onAdminChangeDept({ value: this.selectedDeptId } as MatSelectChange);
          }
      } else {
          this.loadHistory(null);
      }
  }

  loadHistory(receiver: string | null) {
    this.messages = [];
    this.chatService.getChatHistory(receiver).subscribe(data => {
        this.messages = data || [];
        setTimeout(() => this.scrollToBottom(), 200);
    });
  }

  handleIncomingMessage(msg: any) {
      const isGlobalMsg = !msg.receiver; 
      const isDeptMsg = msg.receiver === this.currentViewingDeptId;

      if ((this.activeTab === 'global' && isGlobalMsg) || 
          (this.activeTab === 'dept' && isDeptMsg)) {
          
          const exists = this.messages.some(m => 
              m.user === msg.user && 
              m.message === msg.message && 
              Math.abs(new Date(m.time).getTime() - new Date(msg.time).getTime()) < 1000
          );

          if (!exists) {
              this.messages.push(msg);
              setTimeout(() => this.scrollToBottom(), 100);
          }
      }
  }

  sendMessage() {
    if (!this.txtMessage.trim()) return;
    if (!this.currentUser) {
        this.identifyUser();
    }

    if (!this.currentUser) {
        alert('Lỗi: Không xác định được người dùng. Vui lòng đăng nhập lại.');
        return;
    }

    let receiver: string | null = null;

    if (this.activeTab === 'dept') {
        if (!this.currentViewingDeptId) {
            alert(this.isAdmin ? 'Vui lòng chọn phòng ban.' : 'Bạn chưa thuộc phòng ban nào.');
            return;
        }
        receiver = this.currentViewingDeptId;
    }

    this.chatService.sendMessage(this.currentUser, this.txtMessage, receiver);
    this.txtMessage = ''; 
  }

  isMyMessage(senderEmail: string): boolean {
      return senderEmail?.toLowerCase() === this.currentUser?.toLowerCase();
  }

  parseJwt(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) { return null; }
  }

  toggleChat() { 
      this.isOpen = !this.isOpen; 
      if (this.isOpen) setTimeout(() => this.scrollToBottom(), 200); 
  }

  ngAfterViewChecked() {}

  scrollToBottom(): void { 
      try { 
          if (this.scrollContainer) {
              this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight; 
          }
      } catch(err) { } 
  }
}