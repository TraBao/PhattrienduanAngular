import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { EmployeeListComponent } from './components/employee-list/employee-list';
import { EmployeeFormComponent } from './components/employee-form/employee-form';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { AuthGuard } from './guards/auth.guard';
import { PermissionGuard } from './guards/permission.guard';

import { UserListComponent } from './components/user-list/user-list';
import { LeaveManagerComponent } from './components/leave-manager/leave-manager';
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard';
import { MyProfileComponent } from './components/my-profile/my-profile';
import { PayrollComponent } from './components/payroll/payroll';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { AdminAnnouncementsComponent } from './components/admin-announcements/admin-announcements';
import { DepartmentManagerComponent } from './components/department-manager/department-manager';
import { FormsManagerComponent } from './components/forms-manager/forms-manager';
import { InitialRedirectComponent } from './components/initial-redirect/initial-redirect.component'; 
export const routes: Routes = [
    { 
        path: '', 
        component: InitialRedirectComponent,
        canActivate: [AuthGuard]
    },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { 
        path: 'employees', 
        component: EmployeeListComponent, 
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: 'MANAGE_EMPLOYEES' }
    },
    { 
        path: 'employees/create', 
        component: EmployeeFormComponent, 
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: 'MANAGE_EMPLOYEES' }
    },
    { 
        path: 'employees/edit/:id', 
        component: EmployeeFormComponent, 
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: 'MANAGE_EMPLOYEES' }
    },

    { path: 'my-profile', component: MyProfileComponent, canActivate: [AuthGuard] },
    
    { 
        path: 'payroll', 
        component: PayrollComponent, 
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: 'MANAGE_PAYROLL' }
    },

    { path: 'dashboard', component: UserDashboardComponent, canActivate: [AuthGuard] },
    
    { 
        path: 'announcements', 
        component: AdminAnnouncementsComponent, 
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: 'MANAGE_ANNOUNCEMENTS' }
    },

    { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard] },
    
    {
        path: 'departments',
        component: DepartmentManagerComponent,
        canActivate: [AuthGuard], 
        data: { roles: ['Admin'] }
    },
    { 
        path: 'forms',
        component: FormsManagerComponent,
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: 'MANAGE_DOCUMENTS' }
    },
    {
        path: 'users',
        component: UserListComponent,
        canActivate: [AuthGuard], 
        data: { roles: ['Admin'] }
    },

    { path: 'leaves', component: LeaveManagerComponent, canActivate: [AuthGuard] },
    { path: '**', redirectTo: '', pathMatch: 'full' },
];