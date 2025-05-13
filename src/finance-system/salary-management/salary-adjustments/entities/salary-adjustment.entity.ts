import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { Payroll } from "../../payrolls/entities/payroll.entity";

export enum ESalaryAdjustmentType {
    Bonus = 'bonus',
    Deduction = 'deduction',
    Advance = 'advance', // used to track this month advance amount
    Allowance = 'allowance', // used to track this month allowance amount
    Unpaid = 'unpaid', // use to track last month unpaid amount
    Past_Advance = 'past_advance', // used to track last month advance amount
    Absent = 'absent', // used to track absent days
    Library_Fine = 'library_fine' // used to track library fine
}

@Entity()
export class SalaryAdjustment extends BaseEntity {
    @Column({ type: 'enum', enum: ESalaryAdjustmentType })
    type: ESalaryAdjustmentType;

    @Column({ type: 'float', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'text' })
    description: string;

    @ManyToOne(() => Payroll, (payroll) => payroll.salaryAdjustments, { onDelete: 'CASCADE', nullable: false })
    payroll: Payroll;
}