export interface LeaveRequest {
    id: number;
    userId: string;
    fullName: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    createdAt: string;
    adminComment?: string;
}

export interface CreateLeaveDto {
    startDate: Date;
    endDate: Date;
    reason: string;
}

export interface UpdateLeaveStatusDto {
    requestId: number;
    status: string;
    adminComment?: string;
}