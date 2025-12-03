import { Component, ElementRef, ViewChild, AfterViewChecked, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material-module';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../services/user.service'; 

@Component({
  selector: 'app-ai-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './ai-widget.html',
  styleUrls: ['./ai-widget.scss']
})
export class AiWidgetComponent implements AfterViewChecked, OnInit, OnDestroy {
  isOpen = false;
  userInput = '';
  isLoading = false;
  messages: { sender: 'ai' | 'user', text: string }[] = [
    { sender: 'ai', text: 'Xin chào! Tôi là AI Hỗ trợ nhân sự. Bạn cần giúp gì về chính sách, hợp đồng hay quy định?' }
  ];

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  btnPosition = { x: 0, y: 0 };
  boxPosition = { x: 0, y: 0 };

  private isDragging = false;
  private dragStartTime = 0;
  private dragOffset = { x: 0, y: 0 };
  private mouseMoveListener: any;
  private mouseUpListener: any;

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.btnPosition = { 
        x: window.innerWidth - 80, 
        y: window.innerHeight - 150 
    };
    this.updateBoxPosition();
  }

  onBtnClick(event: MouseEvent) {
    const clickDuration = Date.now() - this.dragStartTime;
    if (clickDuration < 200 && !this.isDragging) {
        this.toggleAi();
    }
  }

  toggleAi() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.updateBoxPosition();
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  updateBoxPosition() {
    let boxX = this.btnPosition.x - 350;
    let boxY = this.btnPosition.y - 480 + 60;

    if (boxX < 20) {
        boxX = this.btnPosition.x + 70;
    }
    if (boxY < 20) {
        boxY = 20;
    }

    if (boxY + 480 > window.innerHeight) {
        boxY = window.innerHeight - 500;
    }

    this.boxPosition = { x: boxX, y: boxY };
  }
  onBtnDragStart(event: MouseEvent) {
    this.dragStartTime = Date.now();
    this.isDragging = false;

    this.dragOffset.x = event.clientX - this.btnPosition.x;
    this.dragOffset.y = event.clientY - this.btnPosition.y;

    this.mouseMoveListener = this.onBtnDragMove.bind(this);
    this.mouseUpListener = this.onBtnDragEnd.bind(this);

    window.addEventListener('mousemove', this.mouseMoveListener);
    window.addEventListener('mouseup', this.mouseUpListener);
  }

  onBtnDragMove(event: MouseEvent) {
    this.isDragging = true;
    
    event.preventDefault();
    let newX = event.clientX - this.dragOffset.x;
    let newY = event.clientY - this.dragOffset.y;
    newX = Math.max(10, Math.min(newX, window.innerWidth - 70));
    newY = Math.max(10, Math.min(newY, window.innerHeight - 70));

    this.btnPosition = { x: newX, y: newY };
    if (this.isOpen) {
        this.updateBoxPosition();
    }
  }

  onBtnDragEnd() {
    window.removeEventListener('mousemove', this.mouseMoveListener);
    window.removeEventListener('mouseup', this.mouseUpListener);
    setTimeout(() => {
        this.isDragging = false;
    }, 0);
  }
  formatText(text: string): string {
    if (!text) return '';
    return text.replace(/\n/g, '<br>');
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const question = this.userInput;
    this.messages.push({ sender: 'user', text: question });
    this.userInput = '';
    this.isLoading = true;
    this.scrollToBottom();
    
    const currentUser = this.userService.getCurrentUserValue();
    const body = {
        prompt: question,
        userName: currentUser?.email || 'Khách',
        role: (currentUser?.roles?.includes('Admin')) ? 'Admin' : 'Nhân viên'
    };
    
    this.http.post<any>('http://localhost:5195/api/ai/ask', body)
      .subscribe({
        next: (res) => {
          this.messages.push({ sender: 'ai', text: res.answer });
          this.isLoading = false;
          this.scrollToBottom();
        },
        error: () => {
          this.messages.push({ sender: 'ai', text: 'Lỗi kết nối AI hoặc hết quota.' });
          this.isLoading = false;
        }
      });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  ngOnDestroy() {
    window.removeEventListener('mousemove', this.mouseMoveListener);
    window.removeEventListener('mouseup', this.mouseUpListener);
  }
}