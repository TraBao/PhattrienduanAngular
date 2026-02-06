import { Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material-module'; 
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { ChatService, MessageType } from '../../services/chat.service';
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
export class ChatWidgetComponent implements OnInit, OnDestroy {
  isOpen = false;
  txtMessage = '';
  messages: any[] = [];
  currentUserEmail = ''; 
  currentUserId = '';
  isAdmin = false;

  activeTab: 'global' | 'dept' | 'private' = 'global';
  currentViewingDeptId: string | null = null;
  departments: any[] = [];
  myDeptName: string = '';
  employees: any[] = [];
  filteredEmployees: any[] = [];
  searchQuery: string = '';
  selectedUserChat: any = null;

  private subs = new Subscription();
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private employeeService: EmployeeService,
    private deptService: DepartmentService
  ) {}

  ngOnInit(): void {
    this.identifyUser();
    this.chatService.startConnection().then(() => {
        if (this.activeTab === 'global') {
            this.chatService.joinGeneralChat();
        }
    });
    this.subs.add(this.chatService.messageReceived.subscribe(msg => {
        if (msg) this.handleIncomingMessage(msg);
    }));
    this.subs.add(this.chatService.reactionReceived.subscribe(react => {
        if (react) this.handleIncomingReaction(react);
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
  identifyUser(): void {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 Token Payload Raw:', payload);
        let foundEmail = '';
        if (payload.email) foundEmail = payload.email;
        else if (payload.Email) foundEmail = payload.Email;
        else if (payload.unique_name) foundEmail = payload.unique_name;
        else if (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']) {
            foundEmail = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
        }
        else if (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']) {
            foundEmail = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
        }
        else if (payload.sub && payload.sub.includes('@')) {
            foundEmail = payload.sub;
        }

        this.currentUserEmail = foundEmail;
        const role = payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        this.isAdmin = Array.isArray(role) ? role.includes('Admin') : role === 'Admin';
        
        console.log(`✅ Đã nhận diện: ${this.currentUserEmail} (Admin: ${this.isAdmin})`);

        if (this.currentUserEmail) this.initData();
      } catch (e) {
        console.error('Lỗi đọc token:', e);
      }
    }
  }

  initData(): void {
    this.loadEmployees();
    this.loadAllDepartments();
    this.switchTab('global');
  }
  switchTab(tab: 'global' | 'dept' | 'private') {
    this.activeTab = tab;
    this.messages = [];
    this.currentViewingDeptId = null;
    this.selectedUserChat = null;

    if (tab === 'global') {
        this.chatService.joinGeneralChat();
        this.loadHistory(null, MessageType.General);
    } 
    else if (tab === 'dept') {
        if (!this.isAdmin) {
            this.loadMyDepartment();
        } else {
            this.loadAllDepartments();
        }
    }
  }
  loadAllDepartments(): void {
    this.deptService.getAll().subscribe({
      next: (res: any) => {
        console.log('🏢 Departments API Response:', res);
        let data = [];
        if (Array.isArray(res)) {
            data = res;
        } else if (res && Array.isArray(res.data)) {
            data = res.data;
        } else if (res && Array.isArray(res.result)) {
            data = res.result;
        }

        this.departments = data;
        
        if (this.departments.length === 0) {
            console.warn('⚠️ Không tìm thấy phòng ban nào trong DB.');
        }
      },
      error: (err) => console.error('❌ Lỗi load phòng ban:', err)
    });
  }
  loadEmployees(): void {
  if (!this.currentUserEmail) {
    console.warn("Chưa có currentUserEmail, tạm dừng loadEmployees.");
    return;
  }

  this.employeeService.getAllEmployeesForSelection().subscribe({
    next: (employeesFromApi: any[]) => {
      console.log("--- EMAIL DÙNG ĐỂ LỌC ---", this.currentUserEmail);
      console.log("--- DỮ LIỆU NHÂN VIÊN TỪ API (DẠNG BẢNG) ---");
      console.table(employeesFromApi);

      if (!Array.isArray(employeesFromApi)) {
          console.error("API không trả về một mảng!", employeesFromApi);
          this.employees = [];
          this.filteredEmployees = [];
          return;
      }
      
      const currentUserEmailLower = this.currentUserEmail.toLowerCase();

      this.employees = employeesFromApi.filter(e => {
          const employeeEmail = e.email || e.Email;
          return employeeEmail && employeeEmail.toLowerCase() !== currentUserEmailLower;
      });
      
      this.filteredEmployees = [...this.employees];

      console.log(`✅ Đã load và filter, còn lại ${this.filteredEmployees.length} đồng nghiệp.`);
    },
    error: (err: any) => console.error('❌ Lỗi API Nhân viên:', err)
  });
}

loadMyDepartment(): void {
    this.employeeService.getMyProfile().subscribe((emp: any) => {
        const deptId = emp.departmentId || emp.DepartmentId;
        const deptName = emp.departmentName || emp.DepartmentName || 'Phòng của tôi';

        if (deptId) {
            this.selectDeptChannel({ id: deptId, name: deptName });
        }
    });
  }

  selectDeptChannel(dept: any): void {
      this.currentViewingDeptId = dept.id.toString();
      this.myDeptName = dept.name;
      this.chatService.joinDepartmentChat(this.currentViewingDeptId);
      this.loadHistory(this.currentViewingDeptId, MessageType.Department);
  }

  selectUserToChat(emp: any): void {
      this.selectedUserChat = emp;
      this.loadHistory(emp.email, MessageType.Private);
  }
  loadHistory(receiverId: string | null, type: MessageType): void {
    this.chatService.getChatHistory(receiverId, type).subscribe(data => {
        const history = data || [];
        this.messages = history.map((m: any) => {
            if (m.isMe === undefined) {
                m.isMe = this.checkIsMe(m.user || m.SenderEmail);
            }
            return m;
        });

        setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  handleIncomingMessage(msg: any): void {
        const type = msg.type;
        const receiver = msg.receiver;
        const sender = msg.user;

        if (msg.isMe === undefined) {
            msg.isMe = this.checkIsMe(sender);
        }

        let shouldAdd = false;
        if (this.activeTab === 'global' && type === MessageType.General) {
            shouldAdd = true;
        } 
        else if (this.activeTab === 'dept' && type === MessageType.Department && receiver == this.currentViewingDeptId) {
            shouldAdd = true;
        } 
        else if (this.activeTab === 'private' && type === MessageType.Private) {
             const isFromContact = this.selectedUserChat && sender === this.selectedUserChat.email;
             const isFromMeToContact = this.selectedUserChat && sender === this.currentUserEmail && receiver === this.selectedUserChat.email;
             
             if (isFromContact || isFromMeToContact) shouldAdd = true;
        }

        if (shouldAdd) {
            this.messages.push(msg);
            setTimeout(() => this.scrollToBottom(), 50);
        }
    }
  checkIsMe(senderEmail: string): boolean {
      if (!senderEmail || !this.currentUserEmail) return false;
      return senderEmail.toLowerCase() === this.currentUserEmail.toLowerCase();
  }

  sendMessage(): void {
    if (!this.txtMessage.trim()) return;

    let type = MessageType.General;
    let receiverId: string | null = null;

    if (this.activeTab === 'dept') {
        type = MessageType.Department;
        receiverId = this.currentViewingDeptId;
    } else if (this.activeTab === 'private') {
        type = MessageType.Private;
        receiverId = this.selectedUserChat?.email;
    }

    this.chatService.sendMessage(this.txtMessage, receiverId, type)
        .then(() => {
            this.txtMessage = '';
        });
  }
  sendReaction(messageId: number, emoji: string): void {
      this.chatService.sendReaction(messageId, emoji);
  }

  handleIncomingReaction(react: any): void {
      const msg = this.messages.find(m => m.id === react.messageId);
      if (msg) msg.reactions = react.emoji;
  }

  toggleChat() { 
    this.isOpen = !this.isOpen; 
    if (this.isOpen) {
        setTimeout(() => this.scrollToBottom(), 300); 
    }
  }

  shouldShowMessages(): boolean {
    if (this.activeTab === 'global') return true;
    if (this.activeTab === 'dept' && this.currentViewingDeptId) return true;
    if (this.activeTab === 'private' && this.selectedUserChat) return true;
    return false;
  }

  scrollToBottom(): void {
      try { 
          if (this.scrollContainer) {
              this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight; 
          }
      } catch(err) { } 
  }

  filterEmployees(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredEmployees = [...this.employees];
      return;
    }
    this.filteredEmployees = this.employees.filter(e => 
      (e.firstName && e.firstName.toLowerCase().includes(q)) || 
      (e.lastName && e.lastName.toLowerCase().includes(q)) || 
      (e.email && e.email.toLowerCase().includes(q))
    );
  }
}