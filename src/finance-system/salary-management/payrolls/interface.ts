import { IAllowance } from "../salary-structures/entities/salary-structure.entity";

export interface ISalaryStructure {
    id: string;
    basicSalary: number;
    teacherId: string | null;
    staffId: string | null;
    payAmount: number;
    date: string | null;
    accountId: string;
    advanceAmount: number | null;
    allowances: string | IAllowance[] | null;
}