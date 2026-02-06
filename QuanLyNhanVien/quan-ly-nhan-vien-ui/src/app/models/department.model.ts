import { Employee } from './employee.model';

export interface Department {
    id: number;
    name: string;
    description?: string;
    managerId?: number | null;
    manager?: Employee | null;
}