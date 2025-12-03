import { Routes } from '@angular/router';
import { EmployeeList } from './components/employee-list/employee-list';
import { EmployeeForm } from './components/employee-form/employee-form';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { AuthGuard } from './guards/auth.guard';
import { UserListComponent } from './components/user-list/user-list';
import { LeaveManagerComponent } from './components/leave-manager/leave-manager';
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard';
import { MyProfileComponent } from './components/my-profile/my-profile';
import { PayrollComponent } from './components/payroll/payroll';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { AdminAnnouncementsComponent } from './components/admin-announcements/admin-announcements';
import { DepartmentManagerComponent } from './components/department-manager/department-manager';

export const routes: Routes = [
    { path: '', component: EmployeeList, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'employees/create', component: EmployeeForm, canActivate: [AuthGuard] },
    { path: 'employees/edit/:id', component: EmployeeForm, canActivate: [AuthGuard] },
    { path: 'my-profile', component: MyProfileComponent, canActivate: [AuthGuard] },
    { path: 'payroll', component: PayrollComponent, canActivate: [AuthGuard] },
    { path: 'dashboard', component: UserDashboardComponent, canActivate: [AuthGuard] },
    { path: 'announcements', component: AdminAnnouncementsComponent, canActivate: [AuthGuard] },
    { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard] },
    {
        path: 'departments',
        component: DepartmentManagerComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'users',
        component: UserListComponent,
        canActivate: [AuthGuard]
    },
    { path: 'leaves', component: LeaveManagerComponent, canActivate: [AuthGuard] },
    { path: '**', redirectTo: '' },
];