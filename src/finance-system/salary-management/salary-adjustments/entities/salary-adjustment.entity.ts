import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { Payroll } from "../../payrolls/entities/payroll.entity";

export enum ESalaryAdjustmentType {
    Bonus = 'bonus',
    deduction = 'deduction',
    advance = 'advance',
}

@Entity()
export class SalaryAdjustment extends BaseEntity {
    @Column({ type: 'enum', enum: ESalaryAdjustmentType })
    type: ESalaryAdjustmentType;

    @Column({ type: 'float', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'text' })
    description: string;

    @ManyToOne(() => Payroll, (payroll) => payroll.salaryAdjustments, { onDelete: 'CASCADE' })
    payroll: Payroll;
}