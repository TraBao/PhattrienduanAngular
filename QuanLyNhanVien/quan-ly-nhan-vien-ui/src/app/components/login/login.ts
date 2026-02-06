import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { AuthApiService } from '../../services/auth-api.service';
import { LoginRequest } from '../../models/auth/login-request.model';
import { LoggedInUser } from '../../services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  hidePassword = true; 

  constructor(
    private fb: FormBuilder,
    private authApiService: AuthApiService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    this.errorMessage = null;
    if (this.loginForm.valid) {
      const loginRequest: LoginRequest = this.loginForm.value;
      
      this.authApiService.login(loginRequest).subscribe({
        next: (user: LoggedInUser) => {
          this.redirectToDashboard(user);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Email hoặc mật khẩu không đúng.';
          console.error('Login Error:', err);
        }
      });
    }
  }

  private redirectToDashboard(user: LoggedInUser | null): void { 
    if (user && user.roles.includes('Admin')) {
        this.router.navigate(['/admin-dashboard']);
    } else {
        this.router.navigate(['/dashboard']);
    }
  }
}