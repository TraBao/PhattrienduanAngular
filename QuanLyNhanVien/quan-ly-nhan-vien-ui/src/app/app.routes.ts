import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { PermissionGuard } from './guards/permission.guard';

import { MainLayoutComponent } from './layouts/main-layout/main-layout';

import { LandingPageComponent } from './components/landing-page/landing-page';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { EmployeeListComponent } from './components/employee-list/employee-list';
import { EmployeeFormComponent } from './components/employee-form/employee-form';
import { UserListComponent } from './components/user-list/user-list';
import { LeaveManagerComponent } from './components/leave-manager/leave-manager';
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard';
import { MyProfileComponent } from './components/my-profile/my-profile';
import { PayrollComponent } from './components/payroll/payroll';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { AdminAnnouncementsComponent } from './components/admin-announcements/admin-announcements';
import { DepartmentManagerComponent } from './components/department-manager/department-manager';
import { FormsManagerComponent } from './components/forms-manager/forms-manager';
import { ActivityLogComponent } from './components/activity-log/activity-log';
import { MeetingListComponent } from './components/meeting-list/meeting-list';

export const routes: Routes = [
    { path: '', component: LandingPageComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },

    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            { path: 'dashboard', component: UserDashboardComponent },
            { path: 'admin-dashboard', component: AdminDashboardComponent },
            { path: 'my-profile', component: MyProfileComponent },
            {
                path: 'employees',
                component: EmployeeListComponent,
            },
            {
                path: 'employees/create',
                component: EmployeeFormComponent,
            },
            {
                path: 'employees/edit/:id',
                component: EmployeeFormComponent,
            },
            {
                path: 'payroll',
                component: PayrollComponent,
                canActivate: [PermissionGuard], data: { permission: 'MANAGE_PAYROLL' }
            },
            {
                path: 'announcements',
                component: AdminAnnouncementsComponent,
                canActivate: [PermissionGuard], data: { permission: 'MANAGE_ANNOUNCEMENTS' }
            },
            { path: 'meetings', component: MeetingListComponent },
            { path: 'departments', component: DepartmentManagerComponent, canActivate: [PermissionGuard], data: { roles: ['Admin'] } },
            { path: 'forms', component: FormsManagerComponent },
            { path: 'users', component: UserListComponent, canActivate: [PermissionGuard], data: { roles: ['Admin'] } },
            { path: 'activity-log', component: ActivityLogComponent, canActivate: [PermissionGuard], data: { roles: ['Admin'] } },
            { path: 'leaves', component: LeaveManagerComponent },
        ]
    },

    { path: '**', redirectTo: '', pathMatch: 'full' },
];