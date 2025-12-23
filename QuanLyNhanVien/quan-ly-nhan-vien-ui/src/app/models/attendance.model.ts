export interface Attendance {
    id: number;
    userId: string;
    date: Date | string;
    checkInTime: Date | string;
    checkOutTime?: Date | string;
    totalHours?: number;
    status?: string;
    note?: string;
}