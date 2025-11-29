import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material-module';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-ai-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './ai-widget.html',
  styleUrls: ['./ai-widget.scss']
})
export class AiWidgetComponent implements AfterViewChecked {
  isOpen = false;
  userInput = '';
  isLoading = false;

  messages: { sender: 'ai' | 'user', text: string }[] = [
    { sender: 'ai', text: 'Xin chào! Tôi là AI Hỗ trợ nhân sự. Bạn cần giúp gì về chính sách, hợp đồng hay quy định?' }
  ];

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  constructor(private http: HttpClient) {}

  toggleAi() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.scrollToBottom();
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
    this.http.post<any>('http://localhost:5195/api/ai/ask', { prompt: question })
      .subscribe({
        next: (res) => {
          this.messages.push({ sender: 'ai', text: res.answer });
          this.isLoading = false;
          this.scrollToBottom();
        },
        error: () => {
          this.messages.push({ sender: 'ai', text: 'Xin lỗi, kết nối AI bị gián đoạn.' });
          this.isLoading = false;
          this.scrollToBottom();
        }
      });
  }

  ngAfterViewChecked() { this.scrollToBottom(); }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}