import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material-module';
import { AuthApiService } from '../../services/auth-api.service';
import { LoginRequest } from '../../models/auth/login-request.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authApiService: AuthApiService,
    private router: Router,
    private userService: UserService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.userService.isLoggedIn()) {
      this.redirectToDashboard(); 
    }
  }

  onSubmit(): void {
    this.errorMessage = null;
    if (this.loginForm.valid) {
      const loginRequest: LoginRequest = this.loginForm.value;
      
      this.authApiService.login(loginRequest).subscribe({
        next: () => {
          this.redirectToDashboard(); 
        },
        error: (err) => {
          this.errorMessage = 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.';
          console.error('Login Error:', err);
        }
      });
    }
  }

  private redirectToDashboard(): void {
    const user = this.userService.getCurrentUserValue(); 

    if (user && user.roles.length > 0) {
        if (user.roles.includes('Admin')) {
            this.router.navigate(['/']); 
        } else if (user.roles.includes('User')) {
            this.router.navigate(['/user-dashboard']); 
        } else {
            this.router.navigate(['/user-dashboard']); 
        }
    } else {
        this.router.navigate(['/']);
    }
  }
}