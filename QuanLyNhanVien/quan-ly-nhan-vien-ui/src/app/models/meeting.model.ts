export interface Meeting {
    id: number;
    title: string;
    roomId: string;
    createdBy: string;
    createdAt: Date;
    isActive: boolean;
}