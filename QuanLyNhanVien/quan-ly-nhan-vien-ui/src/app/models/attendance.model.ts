export interface Attendance {
    id: number;
    userId: string;
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    totalHours?: number;
}